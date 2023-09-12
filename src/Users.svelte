<script lang="ts">
    import TextField from './TextField.svelte';
    import type { EventHandler } from 'svelte/elements';
    import type { UserData } from './Types';

    export let connected_to_chat: boolean;
    export let users: UserData[];
    export let username = '';
    export let this_user: UserData;
    export let supabase_subscription_status: string;

    export let join_room:
        | EventHandler<SubmitEvent, HTMLFormElement>
        | null
        | undefined;
    export let connect_user: (user: UserData) => void;

    function user_data_to_string(user_data: UserData) {
        return `${user_data.username} joined at ${new Date(
            user_data.online_at
        ).toLocaleString()}`;
    }

    function b_joined_room() {
        return this_user !== undefined;
    }
</script>

<p>Online status: {supabase_subscription_status}</p>
<TextField
    on_submit={join_room}
    bind:field_value={username}
    placeholder="username here"
    button_text="join"
/>
<ul>
    {#each users.toReversed() as user}
        <div style="display: flex;">
            <li>{user_data_to_string(user)}</li>
            {#if b_joined_room() && user.user_uuid !== this_user.user_uuid && !connected_to_chat}
                <button
                    style="margin-left: .25rem"
                    on:click={() => connect_user(user)}>connect</button
                >
            {/if}
        </div>
    {/each}
</ul>
