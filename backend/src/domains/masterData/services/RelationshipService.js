const mongoose = require('mongoose');
const eventPublisher = require('../../../events/publishers/EventPublisher');
const { RelationshipSchema } = require('../../../../../database/schema/masterDataSchemas');
const { AppError } = require('../../../shared/errors/AppError');

const Relationship = mongoose.models.Relationship || mongoose.model('Relationship', RelationshipSchema);

class RelationshipService {
  async setRelationship(mappingData) {
    const { sourceType, sourceId, relationshipType, targetType, targetId, tenantId, campusId } = mappingData;

    // 1. Invalidate previous active relationship for this source and relationshipType if 1-to-1 mapping
    await Relationship.updateMany(
      {
        sourceType,
        sourceId,
        relationshipType,
        status: 'ACTIVE'
      },
      {
        $set: {
          status: 'INACTIVE',
          effectiveTo: new Date()
        }
      }
    );

    // 2. Create new Active Relationship entry
    const relationship = new Relationship({
      tenantId: tenantId || 'tenant_campus_01',
      campusId: campusId || 'main_campus',
      sourceType,
      sourceId,
      relationshipType,
      targetType,
      targetId,
      effectiveFrom: new Date(),
      status: 'ACTIVE'
    });

    const saved = await relationship.save();

    // 3. Emit MasterDataUpdated Event to clear reference caches
    await eventPublisher.publish('MasterDataUpdated', {
      domain: 'relationships',
      relationshipType,
      sourceId,
      targetId
    });

    return saved;
  }

  async getRelationshipTarget(sourceType, sourceId, relationshipType) {
    const rel = await Relationship.findOne({
      sourceType,
      sourceId,
      relationshipType,
      status: 'ACTIVE'
    });

    if (!rel) {
      return null;
    }

    return rel.targetId;
  }
}

module.exports = new RelationshipService();
