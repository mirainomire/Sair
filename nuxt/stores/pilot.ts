import { defineStore } from 'pinia'

export type PilotProfile = {
  name: string
  username: string
  rank: string
  homeBase: string
  totalFlightHours: number
  avatarUrl: string
  scheduleToday: string
}

export const usePilotStore = defineStore('pilot', {
  state: () => ({
    profile: null as PilotProfile | null,
  }),
  actions: {
    setProfile(profile: PilotProfile) {
      this.profile = profile
    },
    clear() {
      this.profile = null
    },
  },
})
