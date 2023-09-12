<script lang="ts">
    import Chat from './Chat.svelte';
    import Logo from './Logo.svelte';
    import { type UserData, type ChatMessage } from './Types';
    import Users from './Users.svelte';

    enum SupabaseEvents {
        SYNC = 'sync',
        JOIN_REQUEST = 'join-request',
        ACCEPT_JOIN_REQUEST = 'accept-join-request',
        ICE_CANDIDATE = 'ice-candidate',
    }

    // enum ChatConnnectionState {
    //     REQUESTED,
    //     ACCEPTED,
    // }

    let connected_to_chat: boolean = false;
    let users: UserData[] = [];
    let username: string = '';

    // Supabase
    import { createClient } from '@supabase/supabase-js';

    let supabase_subscription_status: string = 'NEW';

    const supabaseAPI = {
        url: 'https://hytfenlrnifwpfjwhqzl.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dGZlbmxybmlmd3BmandocXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTM5NTA0NzQsImV4cCI6MjAwOTUyNjQ3NH0.WykoCjOTCNJ1cFlQ_aSLZ20K3i_tehz-0ZJIg4SOsx8',
    };
    const user_uuid = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString();
    let this_user: UserData;
    let that_user: UserData;
    let remote_ice_candidates_resolve;
    const remote_ice_candidates: Promise<RTCIceCandidate[]> & {
        resolve?: any;
    } = new Promise((resolve) => {
        remote_ice_candidates_resolve = resolve;
    });
    remote_ice_candidates.resolve = remote_ice_candidates_resolve;

    const pew_channel = 'pew_channel';
    const supabase_client = createClient(supabaseAPI.url, supabaseAPI.key, {
        realtime: {
            params: {
                eventsPerSecond: 2000,
            },
        },
    });
    const supabase_channel = supabase_client.channel(pew_channel);

    supabase_channel
        .on('presence', { event: SupabaseEvents.SYNC }, () => {
            const newState = supabase_channel.presenceState<UserData>();
            console.log('sync', newState);
            users = Object.values(newState).map(([user]) => user);
        })
        .on('broadcast', { event: SupabaseEvents.JOIN_REQUEST }, (payload) => {
            const user: UserData = payload.user;
            if (connected_to_chat) {
                alert(
                    `Join request from user ${user.username}. Leave your current chat to accept.`
                );
            }
            connected_to_chat = confirm(
                `Join request from user ${user.username}. Accept connection?`
            );
            console.log('responded:', connected_to_chat);
            if (connected_to_chat) {
                that_user = user;
                (async () => {
                    await local_chat_connection.setRemoteDescription(
                        that_user.offer
                    );
                    const answer = await local_chat_connection.createAnswer();
                    await local_chat_connection.setLocalDescription(answer);

                    console.log('senging accept messgae');
                    const accept_msg_res = await supabase_channel.send({
                        type: 'broadcast',
                        event: SupabaseEvents.ACCEPT_JOIN_REQUEST,
                        answer,
                    });
                    console.log(accept_msg_res);
                })();
                send_ice_candidates();
            }
        })
        .on(
            'broadcast',
            { event: SupabaseEvents.ACCEPT_JOIN_REQUEST },
            (payload) => {
                console.log('conenction acccepted');
                connected_to_chat = true;
                local_chat_connection.setRemoteDescription(payload.answer);
                send_ice_candidates();
                (async () => {
                    (await remote_ice_candidates).forEach((candidate) => {
                        local_chat_connection.addIceCandidate(candidate);
                    });
                })();
            }
        )
        .on('broadcast', { event: SupabaseEvents.ICE_CANDIDATE }, (payload) => {
            if (payload.user.user_uuid !== that_user.user_uuid) {
                return;
            }
            const candidates: RTCIceCandidate[] = payload.candidates;
            remote_ice_candidates.resolve(candidates);
            console.log('adding candidates:', payload.candidates);
        })
        .subscribe((status, weaska) => {
            supabase_subscription_status = status;
            console.log(status);
            console.log(weaska);
        });

    function connect_user(target_user: UserData) {
        (async () => {
            await local_chat_connection.setLocalDescription(offer);
            connected_to_chat = true;
            that_user = target_user;
            console.log('connecting to user...', target_user);
            supabase_channel.send({
                type: 'broadcast',
                event: SupabaseEvents.JOIN_REQUEST,
                user: this_user,
            });
        })();
    }

    async function join_room() {
        if (supabase_subscription_status !== 'SUBSCRIBED') {
            return;
        }
        if (username === '') {
            alert('no username provided');
            return;
        }
        this_user = {
            username,
            user_uuid,
            online_at: Date.now(),
            offer,
        };
        const presenceTrackStatus = await supabase_channel.track(this_user);
        console.log(presenceTrackStatus);
        username = '';
    }

    // WebRTC

    let message = '';
    const chat_history: ChatMessage[] = [];

    const ice_servers = [
        {
            urls: 'stun:stun.relay.metered.ca:80',
        },
        {
            urls: 'turn:a.relay.metered.ca:80',
            username: 'bcfded06c96f6ee574804b08',
            credential: 'pbZNIvwTHoeHjARo',
        },
    ];

    let local_chat_connection = new RTCPeerConnection({
        iceServers: ice_servers,
    });

    const ice_candidates: RTCIceCandidate[] = [];
    let local_chat_channel = local_chat_connection.createDataChannel('chat');
    let offer: RTCSessionDescriptionInit;
    // const remote_chat_connection = new RTCPeerConnection();
    // let remote_chat_channel;

    function send_ice_candidates() {
        console.log('senging ice cnadis');

        supabase_channel.send({
            type: 'broadcast',
            event: SupabaseEvents.ICE_CANDIDATE,
            candidates: ice_candidates,
            user: this_user,
        });
    }

    (async function handshake() {
        offer = await local_chat_connection.createOffer();
        // await ÷

        // TODO!
        // await remote_chat_connection.setRemoteDescription($offer);
        // ans = await remote_chat_connection.createAnswer();
        // await local_chat_connection.setRemoteDescription(ans);
        // await remote_chat_connection.setLocalDescription(ans);
    })();

    local_chat_connection.onsignalingstatechange = () => {
        console.log(
            'signal state change:',
            local_chat_connection.signalingState
        );
    };

    local_chat_connection.onconnectionstatechange = () =>
        (local_chat_connection = local_chat_connection);
    local_chat_channel.onopen = () => (local_chat_channel = local_chat_channel);

    local_chat_connection.onicecandidate = (event) => {
        if (!event.candidate) {
            console.warn('empty ice candidate');
            return;
        }
        ice_candidates.push(event.candidate);
    };
    // remote_chat_connection.onicecandidate = (event) => {
    //     if (!event.candidate) {
    //         console.warn('empty ice candidate');
    //         return;
    //     }
    //     local_chat_connection.addIceCandidate(event.candidate);
    // };

    // remote_chat_connection.ondatachannel = (event) => {
    //     console.log(`connected! ${event}`);
    //     remote_chat_channel = event.channel;
    //     remote_chat_channel.onmessage = (event) => {
    //         chat_history.push({ message: event.data, timestamp: new Date() });
    //         chat_history = chat_history;
    //     };
    // };
    local_chat_channel.onopen = () => {
        // update reactivity or w/e for channel ready state
        local_chat_channel = local_chat_channel;
    };
    local_chat_connection.ondatachannel = (event) =>
        console.log(`fewi${event}`);

    // remote_chat_connection.onicecandidateerror = (event) =>
    //     console.log(`fewifwefefw${event}`);
    local_chat_connection.onicecandidateerror = (event) =>
        console.log('onicecandidateerror', event);

    function send_message() {
        if (message === '' || local_chat_channel.readyState !== 'open') {
            return;
        }
        local_chat_channel.send(message);
        message = '';
    }
</script>

<p>WIP {connected_to_chat ? 'connected' : 'noneccted'}</p>
<main style="display: flex;">
    <div>
        <Chat
            {message}
            {chat_history}
            {send_message}
            connection_state={local_chat_connection.connectionState}
            ready_state={local_chat_channel.readyState}
        />
    </div>
    <div style="margin-left: 2vw;">
        <Users
            {users}
            bind:this_user
            bind:connected_to_chat
            bind:supabase_subscription_status
            {join_room}
            {connect_user}
            bind:username
        />
    </div>
    <Logo />
</main>

<style>
</style>
