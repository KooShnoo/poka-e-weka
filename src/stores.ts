import { writable } from 'svelte/store';

export const offer = writable<RTCSessionDescriptionInit>();
