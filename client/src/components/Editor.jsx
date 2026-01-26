import { useEffect } from "react";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import useNoteStore from "../store/useNoteStore";

export default function Editor({ note }) {
    const updateNote = useNoteStore((state) => state.updateNote);

    // Create editor instance
    const editor = useCreateBlockNote({
        initialContent: note.content && Object.keys(note.content).length > 0 ? note.content : undefined,
    });

    useEffect(() => {
        // If the note changes (e.g. selecting a different note), we might want to update the editor content
        // However, BlockNote's useCreateBlockNote handles initialContent. 
        // Changing the 'note' prop completely re-mounts this component in App.jsx (by key), so we get a fresh editor.
        // If we wanted to re-use the editor, we'd need to use editor.replaceBlocks.
        // For now, assuming App.jsx handles the key={note._id}, we are good.
    }, [note._id]);

    // Debounced save
    useEffect(() => {
        let timeoutId;

        const handleChange = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (editor.document) {
                    updateNote(note._id, { content: editor.document });
                }
            }, 2000); // 2 second debounce
        };

        const unsubscribe = editor.onChange(handleChange);

        return () => {
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, [editor, note._id, updateNote]);

    return (
        <div className="w-full max-w-4xl mx-auto h-full overflow-y-auto p-4 bg-gray-950 text-white">
            <BlockNoteView editor={editor} theme="dark" />
        </div>
    );
}
