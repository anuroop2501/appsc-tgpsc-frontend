import { create } from 'zustand'

const useSyllabusStore = create((set, get) => ({
  topics: {},
  loaded: false,

  setTopics: (examName, topicTree) =>
    set((state) => ({
      topics: { ...state.topics, [examName]: topicTree },
      loaded: true,
    })),

  getTopicsForExam: (exam) => {
    const { topics } = get()
    return topics[exam] || {}
  },

  /**
   * Flatten topic tree { Subject: ['t1','t2'] } → ['Subject > t1', 'Subject > t2']
   */
  getFlatTopics: (exam) => {
    const { topics } = get()
    const tree = topics[exam] || {}
    const flat = []
    Object.entries(tree).forEach(([subject, topicList]) => {
      if (Array.isArray(topicList)) {
        topicList.forEach((t) => flat.push(`${subject} > ${t}`))
      } else if (typeof topicList === 'object') {
        Object.entries(topicList).forEach(([sub, items]) => {
          if (Array.isArray(items)) {
            items.forEach((t) => flat.push(`${subject} > ${sub} > ${t}`))
          }
        })
      }
    })
    return flat
  },

  reset: () => set({ topics: {}, loaded: false }),
}))

export default useSyllabusStore
