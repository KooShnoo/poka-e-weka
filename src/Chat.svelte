<script lang="ts">
    import TextField from './TextField.svelte';
    import type { ChatMessage } from './Types';
    import type { EventHandler } from 'svelte/elements';

    export let message: string;
    export let chat_history: ChatMessage[];
    export let send_message:
        | EventHandler<SubmitEvent, HTMLFormElement>
        | null
        | undefined;
    export let connection_state: string;
    export let ready_state: string;
</script>

<h1>
    Chat is {connection_state} and {ready_state}.
</h1>
<TextField
    on_submit={send_message}
    bind:field_value={message}
    placeholder="message here"
    button_text="send"
/>
<div>
    {#each chat_history.toReversed() as chat_message}
        <p>
            You said: <strong>{chat_message.message}</strong> at {chat_message.timestamp.toLocaleString()}
        </p>
    {/each}
</div>
