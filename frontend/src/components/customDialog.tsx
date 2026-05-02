import { forwardRef, useImperativeHandle, useRef } from "react";

import '@material/web/dialog/dialog.js';
import '@material/web/button/filled-button.js';

export interface DialogHandle {
  open: (title: string, message: string) => void;
}

export const CustomDialog = forwardRef<DialogHandle>((_, ref) => {
  const dialogRef = useRef<any>(null);
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
      <h4 slot="headline" ref={titleRef}>Title</h4>

      <div slot="content">
        <p ref={messageRef}>Message</p>
      </div>

      <div slot="actions">
        <md-filled-button onClick={() => dialogRef.current?.close()}>OK</md-filled-button>
      </div>
    </md-dialog>
  );
});