export type UserData = {
    username: string;
    // user_uuid: `${string}-${string}-${string}-${string}-${string}`;
    user_uuid: string;
    online_at: EpochTimeStamp;
    offer: RTCSessionDescriptionInit;
}

export type ChatMessage = {
    message: string;
    timestamp: Date;
}
