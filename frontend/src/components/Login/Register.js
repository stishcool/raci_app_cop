import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../api/auth';
import '../Login/Login.css';

const Register = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    position: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!validateEmail(form.email)) {
      setError('Введите корректный email');
      setIsLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      setIsLoading(false);
      return;
    }

    if (!form.name.trim()) {
      setError('Имя обязательно для заполнения');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Отправка данных на регистрацию:', form);
      await register(form.email, form.password, form.name, form.position);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Регистрация</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
          required
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Пароль (минимум 6 символов)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          disabled={isLoading}
        />
        <input
          type="text"
          placeholder="Ваше имя"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          disabled={isLoading}
        />
        <input
          type="text"
          placeholder="Должность"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
      <p>Уже есть аккаунт? <a href="/login">Войти</a></p>
    </div>
  );
};

export default Register;