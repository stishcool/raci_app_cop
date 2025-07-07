import React, { useState, useEffect } from 'react';
import { getUsers } from '../../api/auth';
import './ProjectForm.css';

const ProjectForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    id: initialData?.id || Date.now() + Math.random(),
    name: initialData?.name || '',
    description: initialData?.description || '',
    phases: initialData?.phases?.map(phase => ({
      ...phase,
      selectedUsers: phase.selectedUsers || [],
      stages: phase.stages || ['Этап 1'],
      positions: phase.positions || []
    })) || [{ name: 'Фаза 1', stages: ['Этап 1'], selectedUsers: [], positions: [] }],
  });
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [step, setStep] = useState(initialData ? 2 : 1); // Начинаем с Шага 2 при редактировании
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedPositionFilter, setSelectedPositionFilter] = useState('');
  const [isAddUsersOpen, setIsAddUsersOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  console.log('ProjectForm: Рендеринг, step:', step, 'initialData:', initialData, 'formData:', formData);

  const users = getUsers();
  const positionsList = ['Менеджер', 'Разработчик', 'Аналитик', 'Тестировщик'];

  const filteredUsers = users.filter(user =>
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.position.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedPositionFilter ? user.position === selectedPositionFilter : true)
  );

  const handleSelectUser = (userId, position) => {
    const updatedPhases = formData.phases.map((phase, i) =>
      i === currentPhaseIndex
        ? {
            ...phase,
            selectedUsers: phase.selectedUsers.some(u => u.id === userId)
              ? phase.selectedUsers.filter(u => u.id !== userId)
              : [...phase.selectedUsers, { id: userId, name: users.find(u => u.id === userId)?.name || 'Неизвестный', position }],
          }
        : phase
    );
    setFormData({ ...formData, phases: updatedPhases });
    console.log('ProjectForm: Пользователь выбран/снят:', { userId, position });
  };

  const handleProceedToRACI = () => {
    const updatedPhases = formData.phases.map((phase, i) =>
      i === currentPhaseIndex
        ? {
            ...phase,
            positions: [...new Set(phase.selectedUsers.map(u => u.position))].map(pos => ({
              name: pos,
              users: phase.selectedUsers.filter(u => u.position === pos).map(u => ({
                id: u.id,
                name: u.name,
                role: Object.fromEntries(phase.stages.map((_, index) => [index, 'I']))
              }))
            }))
          }
        : phase
    );
    setFormData({ ...formData, phases: updatedPhases });
    setStep(2);
    console.log('ProjectForm: Переход к RACI, updatedPhases:', updatedPhases);
  };

  const handleAddPhase = () => {
    const prevPhase = formData.phases[currentPhaseIndex];
    const newPhase = {
      name: `Фаза ${formData.phases.length + 1}`,
      stages: ['Этап 1'],
      selectedUsers: prevPhase.selectedUsers.map(u => ({
        ...u,
        role: {}
      })),
      positions: prevPhase.positions.map(pos => ({
        name: pos.name,
        users: pos.users.map(u => ({
          ...u,
          role: { 0: 'I' }
        }))
      }))
    };
    setFormData({ ...formData, phases: [...formData.phases, newPhase] });
    setCurrentPhaseIndex(formData.phases.length);
    console.log('ProjectForm: Добавлена новая фаза:', newPhase);
  };

  const handleAddStage = () => {
    if (!newStageName) return;
    const updatedPhases = formData.phases.map((phase, i) =>
      i === currentPhaseIndex
        ? {
            ...phase,
            stages: [...phase.stages, newStageName],
            positions: phase.positions.map(pos => ({
              ...pos,
              users: pos.users.map(u => ({
                ...u,
                role: { ...u.role, [phase.stages.length]: 'I' }
              }))
            }))
          }
        : phase
    );
    setFormData({ ...formData, phases: updatedPhases });
    setNewStageName('');
    console.log('ProjectForm: Добавлен этап:', newStageName);
  };

  const handleStageNameChange = (stageIndex, name) => {
    const updatedPhases = formData.phases.map((phase, i) =>
      i === currentPhaseIndex
        ? { ...phase, stages: phase.stages.map((stage, j) => (j === stageIndex ? name : stage)) }
        : phase
    );
    setFormData({ ...formData, phases: updatedPhases });
    console.log('ProjectForm: Изменено название этапа:', name);
  };

  const handleRemoveStage = (stageIndex) => {
    const updatedPhases = formData.phases.map((phase, i) =>
      i === currentPhaseIndex
        ? {
            ...phase,
            stages: phase.stages.filter((_, j) => j !== stageIndex),
            positions: phase.positions.map(pos => ({
              ...pos,
              users: pos.users.map(u => {
                const { [stageIndex]: _, ...rest } = u.role;
                return { ...u, role: rest };
              })
            }))
          }
        : phase
    );
    setFormData({ ...formData, phases: updatedPhases });
    console.log('ProjectForm: Удалён этап:', stageIndex);
  };

  const handleAddPosition = (newPosition) => {
    if (!newPosition) return;
    const updatedPhases = formData.phases.map((phase, i) =>
      i === currentPhaseIndex
        ? {
            ...phase,
            positions: [
              ...phase.positions,
              {
                name: newPosition,
                users: phase.selectedUsers.filter(u => u.position === newPosition).map(u => ({
                  id: u.id,
                  name: u.name,
                  role: Object.fromEntries(phase.stages.map((_, index) => [index, 'I']))
                }))
              }
            ]
          }
        : phase
    );
    setFormData({ ...formData, phases: updatedPhases });
    console.log('ProjectForm: Добавлена должность:', newPosition);
  };

  const handleRoleChange = (positionName, stageIndex, userId, role) => {
    const updatedPhases = formData.phases.map((phase, i) =>
      i === currentPhaseIndex
        ? {
            ...phase,
            positions: phase.positions.map(pos =>
              pos.name === positionName
                ? {
                    ...pos,
                    users: pos.users.some(u => u.id === userId)
                      ? pos.users.map(u => (u.id === userId ? { ...u, role: { ...u.role, [stageIndex]: role } } : u))
                      : [...pos.users, { id: userId, name: users.find(u => u.id === userId)?.name || 'Неизвестный', role: { [stageIndex]: role } }],
                  }
                : pos
            )
          }
        : phase
    );
    setFormData({ ...formData, phases: updatedPhases });
    console.log('ProjectForm: Изменена роль:', { positionName, stageIndex, userId, role });
  };

  const handleSave = () => {
    console.log('ProjectForm: Сохранение проекта:', formData);
    onSubmit(formData);
  };

  const sortedSelectedUsers = (formData.phases[currentPhaseIndex]?.selectedUsers || [])
    .slice()
    .sort((a, b) => a.position.localeCompare(b.position));

  return (
    <div className="project-form-container">
      <h3>{initialData ? 'Редактировать проект' : 'Создать проект'}</h3>
      <div className="project-form-content">
        {step === 1 ? (
          <div className="user-selection">
            <div className="filter-toggle">
              <button
                className="filter-button"
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              >
                {isFilterPanelOpen ? 'Скрыть фильтры' : 'Фильтры'}
              </button>
              <div className={`filter-panel ${isFilterPanelOpen ? 'open' : ''}`}>
                <h4>Фильтры</h4>
                <select
                  value={selectedPositionFilter}
                  onChange={(e) => setSelectedPositionFilter(e.target.value)}
                >
                  <option value="">Все должности</option>
                  {positionsList.map((position, index) => (
                    <option key={index} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Название проекта"
              className="project-title-input"
            />
            <h4>Выберите участников для фазы {formData.phases[currentPhaseIndex].name} и нажмите ОК</h4>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по фамилии или должности"
              className="search-input"
            />
            <div className="user-list">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`user-item ${formData.phases[currentPhaseIndex].selectedUsers.some(u => u.id === user.id) ? 'selected' : ''}`}
                  onClick={() => handleSelectUser(user.id, user.position)}
                >
                  <span>{user.name} ({user.position})</span>
                  <input
                    type="checkbox"
                    checked={formData.phases[currentPhaseIndex].selectedUsers.some(u => u.id === user.id)}
                    onChange={() => {}} // Пустой обработчик
                    readOnly
                  />
                </div>
              ))}
            </div>
            <button className="proceed-button" onClick={handleProceedToRACI}>
              ОК
            </button>
          </div>
        ) : (
          <div className="raci-section">
            <div className="phase-selection">
              <select
                value={currentPhaseIndex}
                onChange={(e) => setCurrentPhaseIndex(Number(e.target.value))}
              >
                {formData.phases.map((phase, index) => (
                  <option key={index} value={index}>
                    {phase.name}
                  </option>
                ))}
              </select>
              <button type="button" className="add-button" onClick={handleAddPhase}>
                +
              </button>
            </div>
            <div className="phase-name">
              <input
                type="text"
                value={formData.phases[currentPhaseIndex]?.name || ''}
                onChange={(e) => {
                  const updatedPhases = formData.phases.map((phase, i) =>
                    i === currentPhaseIndex ? { ...phase, name: e.target.value } : phase
                  );
                  setFormData({ ...formData, phases: updatedPhases });
                }}
                placeholder="Название фазы"
              />
            </div>
            <button
              className="add-users-button"
              onClick={() => setIsAddUsersOpen(!isAddUsersOpen)}
            >
              {isAddUsersOpen ? 'Скрыть участников' : 'Добавить участников'}
            </button>
            <div className="raci-content">
              <div className="raci-table-container">
                <h4>RACI-матрица</h4>
                <table className="raci-table">
                  <thead>
                    <tr>
                      <th></th>
                      {formData.phases[currentPhaseIndex]?.positions.map((position, index) => (
                        <th key={index}>
                          {position.name}
                          <select
                            value={position.users[0]?.id || ''}
                            onChange={(e) => {
                              const userId = Number(e.target.value);
                              const updatedPhases = formData.phases.map((phase, i) =>
                                i === currentPhaseIndex
                                  ? {
                                      ...phase,
                                      positions: phase.positions.map(pos =>
                                        pos.name === position.name
                                          ? {
                                              ...pos,
                                              users: userId
                                                ? [
                                                    {
                                                      id: userId,
                                                      name: users.find(u => u.id === userId)?.name || 'Неизвестный',
                                                      role: pos.users[0]?.role || Object.fromEntries(phase.stages.map((_, idx) => [idx, 'I']))
                                                    }
                                                  ]
                                                : []
                                            }
                                          : pos
                                      )
                                    }
                                  : phase
                              );
                              setFormData({ ...formData, phases: updatedPhases });
                              console.log('ProjectForm: Выбран пользователь для должности:', { position: position.name, userId });
                            }}
                          >
                            <option value="">Выберите пользователя</option>
                            {formData.phases[currentPhaseIndex].selectedUsers
                              .filter(u => u.position === position.name)
                              .map(user => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                          </select>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.phases[currentPhaseIndex]?.stages.map((stage, stageIndex) => (
                      <tr key={stageIndex}>
                        <td>
                          <input
                            type="text"
                            value={stage}
                            onChange={(e) => handleStageNameChange(stageIndex, e.target.value)}
                            placeholder="Название этапа"
                          />
                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => handleRemoveStage(stageIndex)}
                          >
                            ×
                          </button>
                        </td>
                        {formData.phases[currentPhaseIndex]?.positions.map((position, posIndex) => (
                          <td key={posIndex}>
                            <select
                              value={position.users[0]?.role?.[stageIndex] || 'I'}
                              onChange={(e) => handleRoleChange(position.name, stageIndex, position.users[0]?.id, e.target.value)}
                              disabled={!position.users[0]}
                            >
                              <option value="I">Informed</option>
                              <option value="R">Responsible</option>
                              <option value="A">Accountable</option>
                              <option value="C">Consulted</option>
                            </select>
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <input
                          type="text"
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          placeholder="Новый этап"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddStage();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="add-button"
                          onClick={handleAddStage}
                        >
                          +
                        </button>
                      </td>
                      {formData.phases[currentPhaseIndex]?.positions.map((_, posIndex) => (
                        <td key={posIndex}></td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <div className="add-position">
                  <input
                    type="text"
                    placeholder="Новая должность"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddPosition(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="add-button"
                    onClick={() => {
                      const input = document.querySelector('.add-position input');
                      handleAddPosition(input.value);
                      input.value = '';
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className={`add-users-panel ${isAddUsersOpen ? 'open' : ''}`}>
                <h4>Добавить участников</h4>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по фамилии или должности"
                  className="search-input"
                />
                <select
                  value={selectedPositionFilter}
                  onChange={(e) => setSelectedPositionFilter(e.target.value)}
                >
                  <option value="">Все должности</option>
                  {positionsList.map((position, index) => (
                    <option key={index} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
                <div className="user-list">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className={`user-item ${formData.phases[currentPhaseIndex].selectedUsers.some(u => u.id === user.id) ? 'selected' : ''}`}
                      onClick={() => handleSelectUser(user.id, user.position)}
                    >
                      <span>{user.name} ({user.position})</span>
                      <input
                        type="checkbox"
                        checked={formData.phases[currentPhaseIndex].selectedUsers.some(u => u.id === user.id)}
                        onChange={() => {}} // Пустой обработчик
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <button className="save-button" onClick={handleSave}>
        Сохранить
      </button>
    </div>
  );
};

export default ProjectForm;