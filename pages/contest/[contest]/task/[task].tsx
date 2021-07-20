import renderMathInElement from "katex/dist/contrib/auto-render";
import { AuthAction, withAuthUser } from "next-firebase-auth";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../../../../styles/Task.module.css";
import dynamic from "next/dynamic";
import marked from "../../../../utils/initMarked";
const SimpleMDE = dynamic(() => import("react-simplemde-editor"), {
  ssr: false,
});
import { useContestId } from "../../../../utils/useContestId";
import { useTaskId } from "../../../../utils/useTaskId";
import firebase from "firebase/app";
import "firebase/database";
import debounce from "lodash.debounce";
import toast, { Toaster } from "react-hot-toast";
import { FloatingButton } from "../../../../components/FloatingButton";
import { BlackIconSpinner } from "../../../../components/Spinner";
import { Button } from "../../../../components/Button";
import styled from "styled-components";

const RenameButton = styled(Button)`
  margin: auto 0px;
  position: absolute;
  right: 2vmin;
  top: calc(0.67 * 32px + 18.5px);
  transform: translate(0%, -50%);
`;
const PDFButton = (props: any) => (
  <FloatingButton {...props} index={2}>
    {props.disabled ? <BlackIconSpinner /> : "📄"}
  </FloatingButton>
);
const SaveButton = (props: any) => (
  <FloatingButton {...props} index={1}>
    📥
  </FloatingButton>
);
const OverrideButton = (props: any) => (
  <FloatingButton {...props} index={0}>
    🎛️
  </FloatingButton>
);

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(function Contest() {
  const router = useRouter();
  const contestId = useContestId();
  const taskId = useTaskId();
  const outputRef = useRef<HTMLDivElement>(null);
  const [markdownInput, setMarkdownInput] = useState<string>("");
  useEffect(() => {
    const outputDiv = outputRef.current;
    if (!outputDiv) {
      return;
    }
    outputDiv.innerHTML = marked(markdownInput.replaceAll(/\\/g, "\\\\"));
    renderMathInElement(outputDiv, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
      ],
      throwOnError: false,
    });
  }, [markdownInput]);
  const fetchMarkdown = () => {
    if (!contestId || !taskId) {
      return;
    }
    return new Promise((reso) =>
      firebase
        .database()
        .ref("tasks/" + taskId + "/markdown")
        .once("value", (docs) => {
          setMarkdownInput(docs.val());
          reso(docs.val());
        })
    );
  };
  const [name, setName] = useState<string>("");
  const fetchName = () => {
    if (!contestId || !taskId) {
      return;
    }
    return new Promise((reso) =>
      firebase
        .database()
        .ref("tasks/" + taskId + "/name")
        .once("value", (docs) => {
          setName(docs.val());
          reso(docs.val());
        })
    );
  };
  const storeMarkdown = useMemo(
    () =>
      debounce((markdownInput) => {
        if (!contestId || !taskId) {
          return;
        }
        toast("Saving...", {
          position: "bottom-center",
          icon: "💾",
        });
        return firebase
          .database()
          .ref("tasks/" + taskId + "/markdown")
          .set(markdownInput);
      }, 10000),
    [contestId, taskId]
  );
  useEffect(() => {
    fetchMarkdown();
    fetchName();
  }, [contestId, taskId]);
  useEffect(() => {
    markdownInput && storeMarkdown(markdownInput);
  }, [markdownInput]);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const generatePdf = async () => {
    setPdfLoading(true);
  };
  const saveMarkdown = () => {
    saveAs(
      new Blob([markdownInput], { type: "text/plain;charset=utf-8" }),
      "document.md"
    );
  };
  const promptRenameTask = () => {
    const newName = prompt("Enter new task name", name) ?? name;
    firebase
      .database()
      .ref("tasks/" + taskId + "/name")
      .set(newName)
      .then(() => setName(newName));
  };
  return (
    <>
      <div className={styles.container}>
        <div className={styles.topbar}>
          <h1 className={styles.title}>Edit Task: {name}</h1>
          <RenameButton onClick={promptRenameTask}>Rename</RenameButton>
        </div>
        <div className={styles.panelcontainer}>
          <div className={`${styles["col-6"]} ${styles["edit-pane"]}`}>
            <SimpleMDE
              value={markdownInput}
              onChange={setMarkdownInput}
              options={useMemo(
                () => ({
                  toolbar: false,
                  spellChecker: false,
                  status: false,
                }),
                []
              )}
            />
          </div>
          <div
            className={`${styles["col-6"]} ${styles["preview-pane"]} ${styles["markdown-body"]} markdown-body`}
            ref={outputRef}
          ></div>
        </div>
      </div>
      <Toaster />
      <PDFButton disabled={pdfLoading} onClick={generatePdf} />
      <SaveButton onClick={saveMarkdown} />
      <OverrideButton onClick={saveMarkdown} />
    </>
  );
});
