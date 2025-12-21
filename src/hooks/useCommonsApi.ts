import { useWikimediaAuth } from './useWikimediaAuth';

const API_URL = 'https://commons.wikimedia.org/w/api.php';

export function useCommonsApi() {
  const { getValidAccessToken } = useWikimediaAuth();

  async function getCsrfToken() {
    const token = await getValidAccessToken();
    if (!token) throw new Error('Not authenticated');

    const parameters = new URLSearchParams({
      action: 'query',
      meta: 'tokens',
      type: 'csrf',
      format: 'json',
      crossorigin: 'true',
    });

    const res = await fetch(`${API_URL}?${parameters.toString()}`, {
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

    const res = await fetch(`${API_URL}?crossorigin=true`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.info);
    }
    return data;
  };

  return { getCsrfToken, uploadFile };
}
