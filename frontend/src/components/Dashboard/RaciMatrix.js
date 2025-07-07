import React, { useState } from 'react';
import './RaciMatrix.css';

const RaciMatrix = ({ phases, selectedUsers, users }) => {
  const [roles, setRoles] = useState(['R', 'A', 'C', 'I']);
  const [newRole, setNewRole] = useState('');
  const [matrix, setMatrix] = useState({});

  const initializeMatrix = () => {
    const newMatrix = {};
    phases.forEach(phase => {
      phase.stages.forEach(stage => {
        selectedUsers.forEach(userId => {
          newMatrix[`${phase.id}-${stage.id}-${userId}`] = 'I';
        });
      });
    });
    return newMatrix;
  };

  useState(() => {
    setMatrix(initializeMatrix());
  }, [phases, selectedUsers]);

  const handleRoleChange = (phaseId, stageId, userId, role) => {
    setMatrix({
      ...matrix,
      [`${phaseId}-${stageId}-${userId}`]: role,
    });
  };

  const handleAddRole = () => {
    if (!newRole.trim() || roles.includes(newRole)) return;
    setRoles([...roles, newRole]);
    setNewRole('');
  };

  return (
    <div className="raci-matrix">
      <h3>RACI-матрица</h3>
      <input
        type="text"
        placeholder="Новая роль"
        value={newRole}
        onChange={(e) => setNewRole(e.target.value)}
      />
      <button onClick={handleAddRole}>Добавить роль</button>
      {phases.map(phase => (
        <div key={phase.id}>
          <h4>{phase.name}</h4>
          {phase.stages.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Этап</th>
                  {selectedUsers.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return <th key={userId}>{user.name} ({user.position})</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {phase.stages.map(stage => (
                  <tr key={stage.id}>
                    <td>{stage.name}</td>
                    {selectedUsers.map(userId => (
                      <td key={userId}>
                        <select
                          value={matrix[`${phase.id}-${stage.id}-${userId}`] || 'I'}
                          onChange={(e) => handleRoleChange(phase.id, stage.id, userId, e.target.value)}
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Нет этапов</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default RaciMatrix;