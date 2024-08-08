class SobrietyService {
    constructor() {
      this.sobrietyTracker = {};
    }
  
    startTracking(userId) {
      this.sobrietyTracker[userId] = Date.now();
    }
  
    getStatus(userId) {
      if (!this.sobrietyTracker[userId]) {
        return null;
      }
      const seconds = Math.floor((Date.now() - this.sobrietyTracker[userId]) / 1000);
      return {
        seconds,
        minutes: Math.floor(seconds / 60),
        hours: Math.floor(seconds / 3600),
        days: Math.floor(seconds / 86400),
      };
    }
  
    resetTracking(userId) {
      this.sobrietyTracker[userId] = Date.now();
    }
  }
  
  module.exports = SobrietyService;