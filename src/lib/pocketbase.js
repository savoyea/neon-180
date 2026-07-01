import PocketBase from 'pocketbase'

export const pb = new PocketBase(
  import.meta.env.VITE_PB_URL || 'https://dart.arsava.fr'
)

// Persist auth entre les rechargements
pb.autoCancellation(false)
