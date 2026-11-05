const { ValidationError } = require('../../../shared/errors/AppError');

const VALID_CATEGORY_HIERARCHY = {
  ACADEMICS: ['ACADEMICS_GENERAL', 'FACULTY_BEHAVIOUR', 'ATTENDANCE', 'SEMESTER_EXAM', 'RESULTS_GRADES'],
  FACULTY: ['FACULTY_GENERAL', 'FACULTY_BEHAVIOUR'],
  ATTENDANCE: ['ATTENDANCE_GENERAL', 'ATTENDANCE_CORRECTION'],
  EXAM: ['EXAM_GENERAL', 'SEMESTER_EXAM', 'RESULTS_GRADES'],
  HOSTEL: ['HOSTEL_GENERAL', 'ROOM_MAINTENANCE', 'UTILITIES', 'WARDEN_ASSISTANCE'],
  FACILITIES: ['FACILITIES_GENERAL', 'ROOM_MAINTENANCE', 'UTILITIES'],
  TRANSPORT: ['TRANSPORT_GENERAL', 'BUS_TIMING', 'PASS_RENEWAL'],
  SECURITY: ['SECURITY_GENERAL', 'RAGGING_PREVENTION', 'HARASSMENT_REDRESSAL', 'SECURITY_PATROL'],
  MESS_FOOD: ['MESS_GENERAL', 'FOOD_HYGIENE'],
  IT_SERVICES: ['IT_GENERAL', 'WIFI_ACCESS', 'ERP_PORTAL', 'LAB_WORKSTATION'],
  LIBRARY: ['LIBRARY_GENERAL', 'DIGITAL_RESOURCE', 'BOOK_CIRCULATION'],
  SCHOLARSHIP_FEES: ['SCHOLARSHIP_GENERAL', 'FEE_RECEIPT', 'SCHOLARSHIP_VERIFY'],
  CAMPUS_SAFETY: ['SAFETY_GENERAL', 'RAGGING_PREVENTION', 'HARASSMENT_REDRESSAL', 'SECURITY_PATROL'],
  GENERAL_OTHER: ['OTHER_GENERAL', 'GENERAL_INQUIRY', 'OTHER_FACILITIES']
};

class ComplaintValidationService {
  validate(payload) {
    const rawTitle = payload?.title || payload?.subject || '';
    const rawDesc = payload?.description || '';
    const rawCat = payload?.categoryCode || payload?.category || '';
    let rawSub = payload?.subcategoryCode || '';

    if (!rawTitle || typeof rawTitle !== 'string' || rawTitle.trim().length < 3) {
      throw new ValidationError('Subject/Title must be at least 3 characters long.', 'VAL_TITLE_SHORT');
    }

    if (!rawDesc || typeof rawDesc !== 'string' || rawDesc.trim().length < 5) {
      throw new ValidationError('Description must be at least 5 characters long.', 'VAL_DESC_SHORT');
    }

    if (!rawCat) {
      throw new ValidationError('Category is required.', 'VAL_CAT_REQUIRED');
    }

    const normCat = rawCat.toUpperCase().trim();
    const allowedSubcategories = VALID_CATEGORY_HIERARCHY[normCat] || [`${normCat}_GENERAL`];

    if (!rawSub) {
      rawSub = allowedSubcategories[0];
    }
    const normSub = rawSub.toUpperCase().trim();

    return {
      title: rawTitle.trim(),
      description: rawDesc.trim(),
      categoryCode: normCat,
      subcategoryCode: normSub
    };
  }
}

module.exports = new ComplaintValidationService();
