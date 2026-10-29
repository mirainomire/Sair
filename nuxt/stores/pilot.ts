import { defineStore } from 'pinia'

export type PilotProfile = {
  name: string
  username: string
  rank: string
  homeBase: string
  crewId: string
  aircraftRatings: string[]
  email: string
  mobile: string
  operationsContacts: {
    crewScheduling: { phone: string; whatsapp: string; hours: string }
    occ: { phone: string; whatsapp: string; hours: string }
  }
  totalFlightHours: number
  avatarUrl: string
  scheduleToday: string
  lastSyncedAt: string
}

export const usePilotStore = defineStore('pilot', {
  state: () => ({
    profile: null as PilotProfile | null,
  }),
  actions: {
    setProfile(profile: PilotProfile) {
      this.profile = profile
    },
    setLastSyncedAt(value: string) {
      if (this.profile) this.profile.lastSyncedAt = value
    },
    clear() {
      this.profile = null
    },
  },
})
