import React, { useState, useEffect } from 'react';
import { getRequests, approveProject, rejectProject } from '../../api/projects';
import ProjectCards from '../Dashboard/ProjectCards';
import ErrorBoundary from '../Dashboard/ErrorBoundary';
import Modal from '../Dashboard/Modal';
import '../Dashboard/Dashboard.css';
import { useNavigate } from 'react-router-dom';

const Requests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = user?.positions?.includes('Администратор');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getRequests();
        setRequests(data);
        applyFilter(data, 'all');
        setError('');
      } catch (error) {
        console.error('Requests: Ошибка получения запросов:', error);
        setError('Сервер недоступен, попробуйте позже');
        setRequests([]);
      }
    };
    fetchRequests();
  }, []);

  const applyFilter = (data, currentFilter) => {
    let filtered = [...data];
    if (currentFilter === 'pending') {
      filtered = filtered.filter(r => r.status === 'draft');
    } else if (currentFilter === 'rejected') {
      filtered = filtered.filter(r => r.status === 'rejected');
    }
    setFilteredRequests(filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilter(value);
    applyFilter(requests, value);
  };

  const handleView = (requestId) => {
    navigate(isAdmin ? `/admin/project/${requestId}` : `/project/${requestId}`);
  };

  const handleApprove = async (requestId) => {
    try {
      await approveProject(requestId);
      const updated = requests.filter(r => r.id !== requestId);
      setRequests(updated);
      applyFilter(updated, filter);
    } catch (error) {
      setError(error.message || 'Ошибка одобрения');
    }
  };

  const handleOpenReject = (requestId) => {
    setRejectId(requestId);
    setIsRejectModalOpen(true);
  };

  const handleReject = async () => {
    try {
      await rejectProject(rejectId);
      const updated = requests.filter(r => r.id !== rejectId);
      setRequests(updated);
      applyFilter(updated, filter);
      setIsRejectModalOpen(false);
      setRejectId(null);
    } catch (error) {
      setError(error.message || 'Ошибка отклонения');
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Запросы</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="filter-container">
        <label>Показать запросы:</label>
        <select value={filter} onChange={handleFilterChange}>
          <option value="all">Все</option>
          <option value="pending">Ожидающие</option>
          <option value="rejected">Отклоненные</option>
        </select>
      </div>
      <div className="projects-area">
        {filteredRequests.length === 0 ? (
          <p>Нет запросов</p>
        ) : (
          <ErrorBoundary>
            <ProjectCards
              projects={filteredRequests}
              onOpenDetails={handleView}
              onApprove={isAdmin ? handleApprove : null}
              onReject={isAdmin ? handleOpenReject : null}
              onOpenRaci={handleView}
              isAdmin={isAdmin}
              showCreator={true}
            />
          </ErrorBoundary>
        )}
      </div>
      {isRejectModalOpen && (
        <Modal onClose={() => setIsRejectModalOpen(false)}>
          <div className="reject-confirm">
            <h3>Подтверждение отклонения</h3>
            <p>Вы уверены, что хотите отклонить этот запрос? Он будет удален.</p>
            <button onClick={handleReject}>Подтвердить</button>
            <button onClick={() => setIsRejectModalOpen(false)}>Отмена</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Requests;