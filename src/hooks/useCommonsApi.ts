import { useWikimediaAuth } from './useWikimediaAuth';

const API_URL = 'https://commons.wikimedia.org/w/api.php';

export function useCommonsApi() {
  const { getValidAccessToken } = useWikimediaAuth();

  // Check if we're properly authenticated on Commons
  async function checkAuth() {
    const token = await getValidAccessToken();
    if (!token) return { authenticated: false, username: null };

    const parameters = new URLSearchParams({
      action: 'query',
      meta: 'userinfo',
      format: 'json',
    });

    const res = await fetch(`${API_URL}?${parameters.toString()}&crossorigin=`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log('Commons auth check:', data);

    const userinfo = data?.query?.userinfo;
    // If anon is present, user is not authenticated
    if (userinfo?.anon !== undefined) {
      return { authenticated: false, username: userinfo?.name || null };
    }

    return { authenticated: true, username: userinfo?.name || null };
  }

  async function getCsrfToken() {
    const token = await getValidAccessToken();
    if (!token) throw new Error('Not authenticated');

    const parameters = new URLSearchParams({
      action: 'query',
      meta: 'tokens',
      type: 'csrf',
      format: 'json',
    });

    // For OAuth authenticated CORS requests, use crossorigin= (empty value)
    // See: https://www.mediawiki.org/wiki/API:Cross-site_requests#Authenticated_CORS_requests_using_OAuth
    const res = await fetch(`${API_URL}?${parameters.toString()}&crossorigin=`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!data.query || !data.query.tokens) {
      throw new Error(`Failed to get CSRF token: ${JSON.stringify(data)}`);
    }

    return data.query.tokens.csrftoken;
  }

  const uploadFile = async (file: File, filename: string, text: string) => {
    const token = await getValidAccessToken();
    if (!token) throw new Error('Not authenticated');

    const csrfToken = await getCsrfToken();

    const form = new FormData();
    form.append('action', 'upload');
    form.append('format', 'json');
    form.append('filename', filename);
    form.append('text', text); // Page content
    form.append('ignorewarnings', '1');
    form.append('token', csrfToken);
    form.append('file', file);

    // For OAuth authenticated CORS requests, use crossorigin= (empty value)
    const result = await fetch(`${API_URL}?crossorigin=`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    const data = await result.json();
    if (data.error) {
      throw new Error(data.error.info);
    }
    return data;
  };

  return { getCsrfToken, uploadFile, checkAuth };
}
