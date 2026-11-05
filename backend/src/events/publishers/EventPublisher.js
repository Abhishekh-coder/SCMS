const EventEmitter = require('events');
const { logger } = require('../../config/logger');

class EventPublisher extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  async publish(eventName, payload) {
    const event = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      eventType: eventName,
      timestamp: new Date().toISOString(),
      payload
    };

    logger.info(`📢 Event Published: [${eventName}] (ID: ${event.eventId})`);
    
    // Asynchronous decoupled emit
    setImmediate(() => {
      this.emit(eventName, event);
      this.emit('*', event);
    });

    return event;
  }
}

const eventPublisher = new EventPublisher();
module.exports = eventPublisher;
