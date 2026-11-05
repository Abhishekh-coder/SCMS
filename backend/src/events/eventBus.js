const EventEmitter = require('events');
const { logger } = require('../config/logger');

class CCMSEventBus extends EventEmitter {
  publish(eventName, payload) {
    logger.info(`📢 Event Published: [${eventName}]`, { payload });
    this.emit(eventName, payload);
  }

  subscribe(eventName, handler) {
    logger.info(`🎧 Subscribed handler for Event: [${eventName}]`);
    this.on(eventName, async (data) => {
      try {
        await handler(data);
      } catch (err) {
        logger.error(`❌ Error in event subscriber for [${eventName}]:`, err);
      }
    });
  }
}

const eventBus = new CCMSEventBus();

module.exports = { eventBus };
