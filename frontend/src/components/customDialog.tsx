import { forwardRef, useImperativeHandle, useRef } from "react";

import '@material/web/dialog/dialog.js';
import '@material/web/button/filled-button.js';

import type { MdDialog } from "@material/web/dialog/dialog.js";

export interface DialogHandle {
  open: (title: string, message: string) => void;
}

export const CustomDialog = forwardRef<DialogHandle>((_, ref) => {
  const dialogRef = useRef<MdDialog>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);

  useImperativeHandle(ref, () => ({
    open: (title: string, message: string) => {
      if (titleRef.current) titleRef.current.innerText = title;
      if (messageRef.current) messageRef.current.innerText = message;

      dialogRef.current?.show();
    },
  }));

  return (
    <md-dialog ref={dialogRef}>
      <div slot="headline" ref={titleRef}>Title</div>

      <div slot="content">
        <div ref={messageRef}>Message</div>
      </div>

      <div slot="actions">
        <md-filled-button onClick={() => dialogRef.current?.close()}>OK</md-filled-button>
      </div>
    </md-dialog>
  );
});
