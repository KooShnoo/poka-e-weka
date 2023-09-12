<script lang="ts">
    import type { EventHandler } from 'svelte/elements';

    export let on_submit:
        | EventHandler<SubmitEvent, HTMLFormElement>
        | null
        | undefined;
    export let field_value: string;
    export let placeholder: string;
    export let button_text: string;
</script>

<form on:submit|preventDefault={on_submit}>
    <input type="text" bind:value={field_value} {placeholder} />
    <button type="submit">{button_text}</button>
</form>
