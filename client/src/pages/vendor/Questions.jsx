import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Loading } from '../../components/common';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [totalUnanswered, setTotalUnanswered] = useState(0);
  const [filter, setFilter] = useState('all');
  const [replyingTo, setReplyingTo] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter !== 'all') params.status = filter;
      const { data } = await api.get('/vendor/questions', { params });
      setQuestions(data.data);
      setPagination(data.pagination);
      setTotalUnanswered(data.totalUnanswered);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filter]);

  const handleAnswer = async (questionId) => {
    if (!answerText.trim()) {
      toast.error('Please write an answer');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/vendor/questions/${questionId}/answer`, { answer: answerText });
      toast.success('Answer submitted!');
      setReplyingTo(null);
      setAnswerText('');
      fetchQuestions(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && questions.length === 0) return <Loading />;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-600">Customer Questions</h1>
        <p className="text-gray-500">Answer customer questions about your products</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Total Questions</p>
          <p className="text-2xl font-bold">{pagination.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Unanswered</p>
          <p className="text-2xl font-bold text-orange-500">{totalUnanswered}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        >
          <option value="all">All Questions</option>
          <option value="unanswered">Unanswered</option>
          <option value="answered">Answered</option>
        </select>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No questions found</p>
          </div>
        ) : (
          questions.map((q) => (
            <div key={q._id} className="bg-white p-6 rounded-xl border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.answer?.content ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {q.answer?.content ? 'Answered' : 'Unanswered'}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="font-medium text-gray-800">{q.question}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    By {q.user?.profile?.firstName || 'Customer'} {q.user?.profile?.lastName || ''}
                  </p>
                </div>
                {q.product && (
                  <Link
                    to={`/products/${q.product.slug}`}
                    className="text-xs text-emerald-600 hover:underline ml-4 flex-shrink-0"
                  >
                    {q.product.name}
                  </Link>
                )}
              </div>

              {/* Existing Answer */}
              {q.answer?.content && (
                <div className="mt-3 ml-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Your Answer</p>
                  <p className="text-sm text-gray-700">{q.answer.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(q.answer.answeredAt).toLocaleDateString()}</p>
                </div>
              )}

              {/* Answer Form */}
              {!q.answer?.content && replyingTo !== q._id && (
                <button
                  onClick={() => { setReplyingTo(q._id); setAnswerText(''); }}
                  className="mt-3 px-4 py-1.5 text-sm text-emerald-600 border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Answer
                </button>
              )}

              {replyingTo === q._id && (
                <div className="mt-3 ml-4">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Write your answer..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] resize-y text-sm"
                    maxLength={1000}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAnswer(q._id)}
                      disabled={submitting}
                      className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Answer'}
                    </button>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-4 py-1.5 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchQuestions(p)}
              className={`px-3 py-1 rounded text-sm ${p === pagination.page ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Questions;
