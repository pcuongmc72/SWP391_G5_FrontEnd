/**
 * Normalizes API response data.
 * - Handles OData "$values" property.
 * - Ensures common properties are available in camelCase (id, code, name).
 * 
 * @param {any} data - The raw API response data.
 * @returns {any} - Normalized data (array or object).
 */
export const normalizeData = (data) => {
  if (!data) return data;
  console.log('Normalizing data:', data);

  // Handle { success: true, data: [...] } or { success: true, data: { $values: [...] } }
  if (data.success !== undefined && data.data !== undefined) {
    return normalizeData(data.data);
  }

  // Handle OData "$values", "values", "items", "Items", "data", "data.items", etc.
  let result = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (data.$values) result = data.$values;
    else if (data.values) result = data.values;
    else if (data.Items) result = data.Items;
    else if (data.items) result = data.items;
    else if (data.data && Array.isArray(data.data)) result = data.data;
    else if (data.data && data.data.$values) result = data.data.$values;
    else {
      // Aggressive search: look for the first property that is an array
      const foundArray = Object.values(data).find(val => Array.isArray(val));
      if (foundArray) result = foundArray;
    }
  }

  // If it's an array, normalize each item
  if (Array.isArray(result)) {
    console.log('Detected array of length:', result.length);
    return result.map(item => normalizeObject(item));
  }

  // If it's a single object, check for deep success/data
  if (result && typeof result === 'object' && result.success !== undefined && result.data !== undefined) {
     return normalizeData(result.data);
  }

  // If it's a single object, normalize it
  if (result && typeof result === 'object') {
    return normalizeObject(result);
  }

  return result;
};

/**
 * Normalizes a single object by ensuring camelCase aliases for PascalCase keys.
 */
const normalizeObject = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

  const normalized = { ...obj };

  // Common property mappings
  const mappings = {
    'Id': 'id',
    'Code': 'code',
    'Name': 'name',
    'Title': 'title',
    'Content': 'content',
    'CourseId': 'courseId',
    'ClassId': 'classId',
    'AuthorId': 'authorId',
    'IsPrivate': 'isPrivate',
    'Status': 'status',
    'CreatedAt': 'createdAt',
    'FullName': 'fullName',
    'Fullname': 'fullName',
    'Role': 'role',
    'TermCode': 'termCode',
    'CourseName': 'courseName',
  };

  Object.entries(mappings).forEach(([pascal, camel]) => {
    if (obj[pascal] !== undefined && obj[camel] === undefined) {
      normalized[camel] = obj[pascal];
    }
  });

  return normalized;
};
