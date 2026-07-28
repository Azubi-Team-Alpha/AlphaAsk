import React from "react";
import type { Message } from "../types";
import { toneStyles } from "../lib/toneStyles";

interface MessageRowProps {
  message: Message;
}

export function MessageRow({ message }: MessageRowProps) {
  if (message.role === "user") {
    return (
      <div className="aa-row aa-user">
        <div className="aa-bubble-user">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="aa-row">
      <div className="aa-assistant-wrap">
        <div className="aa-assistant-mark">α</div>
        <div className="aa-assistant-body">
          <div className="aa-assistant-text">{message.content}</div>
          {message.annotations && message.annotations.length > 0 && (
            <div className="aa-margin">
              {message.annotations.map((a, i) => (
                <span className={`aa-tag ${toneStyles[a.tone].className}`} key={i}>
                  {toneStyles[a.tone].icon}
                  {a.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
