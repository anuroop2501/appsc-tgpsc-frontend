import api from './axiosInstance'

/**
 * Fetch syllabus topic tree for a given exam.
 * @param {string} exam - e.g. 'APPSC Group 1'
 * @returns {Object} topic tree { Subject: ['topic1', 'topic2', ...], ... }
 */
export const getSyllabus = (exam) =>
  api
    .get('/api/syllabus', { params: { exam } })
    .then((r) => r.data)
