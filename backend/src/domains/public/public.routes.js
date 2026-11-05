const express = require('express');
const router = express.Router();

/**
 * GET /api/v1/public/system-summary
 *
 * Public endpoint — no auth required.
 * Returns whether the tenant has opted in to showing public-facing statistics
 * and, if so, the aggregated summary from the reporting layer.
 *
 * showPublicStats is controlled per-tenant via SystemConfig in the DB.
 * When false, the frontend must NOT render any stat cards.
 */
router.get('/system-summary', async (req, res) => {
  try {
    // TODO (Phase 7): Read showPublicStats flag from SystemConfig collection
    // const config = await SystemConfig.findOne({ key: 'publicStats.enabled' });
    // const showPublicStats = config?.value === true;

    // Default: disabled until real reporting data is available
    const showPublicStats = false;

    if (!showPublicStats) {
      return res.json({
        success: true,
        data: {
          showPublicStats: false,
          stats: null,
          message: 'Public statistics are not enabled for this tenant.'
        }
      });
    }

    // When enabled in future — pull from analytics reporting collections
    // const stats = await AnalyticsSummaryService.getPublicSummary();
    return res.json({
      success: true,
      data: {
        showPublicStats: true,
        stats: null, // populated when Phase 5 analytics pipeline is live
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
