package org.linh.lexi.writing.event;

import org.springframework.context.ApplicationEvent;

public class WritingSubmittedApplicationEvent extends ApplicationEvent {

    private final WritingSubmittedMessage message;

    public WritingSubmittedApplicationEvent(Object source, WritingSubmittedMessage message) {
        super(source);
        this.message = message;
    }

    public WritingSubmittedMessage getMessage() {
        return message;
    }
}
