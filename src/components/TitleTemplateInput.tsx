import { useImageSetStore } from "../store/imageSetStore";

export default function TitleTemplateInput() {
    const titleTemplate = useImageSetStore((state) => state.imageSet.titleTemplate);
    const setTitleTemplate = useImageSetStore((state) => state.setTitleTemplate);

    return (
        <section>
            <h2 className="mb-2 text-lg font-medium">Title Template</h2>
            <input
                type="text"
                className="w-full rounded border border-gray-700 bg-zinc-800 p-2 text-gray-300"
                placeholder="Enter title template"
                value={titleTemplate}
                onChange={(e) => setTitleTemplate(e.target.value)}
            />
        </section>
    );
}