import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Quill from 'quill';
import { TOOLBAR_OPTIONS } from '../TextEditor.constants';
import { io } from 'socket.io-client';
import 'quill/dist/quill.snow.css';

export default function TextEditor() {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  useEffect(() => {
    const socket = io('http://localhost:3005');
    setSocket(socket);
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) {
      return;
    }
    socket.once('load-document', document => {
      quill.setContents(document);
      quill.enable();
    });
    socket.emit('get-document', documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) {
      return;
    }
    const handler = delta => {
      quill.updateContents(delta);
    };
    socket.on('receive-changes', handler);

    return () => {
      socket.off('receive-changes', handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) {
      return;
    }
    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta); //sending data from client to server
    };
    quill.on('text-change', handler);

    return () => {
      quill.off('text-change', handler);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback(wrapper => {
    if (wrapper == null) {
      return;
    }
    wrapper.innerHTML = '';
    const editor = document.createElement('div');
    wrapper.append(editor);
    const quill = new Quill(editor, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR_OPTIONS }
    });
    quill.enable(false);
    quill.setText('Loading your document, please wait...');
    setQuill(quill);
  }, []);

  return <div className="textEditor" ref={wrapperRef}></div>;
}
