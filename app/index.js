import React from 'react';
import ReactDOM from 'react-dom';
import jwtDecode from 'jwt-decode';
import { request } from './utils';
import avatarPlacehoder from './assets/images/avatar.png';

import './style.css';

const NODE = document.getElementById('app');
const placeholerInfo = {
  username: '<username>',
  avatar: avatarPlacehoder
};

class App extends React.Component {
  state = this.getInitState();
  getInitState() {
    const state = {};
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      const userInfoStr = localStorage.getItem(`user_${decoded.id}`);
      state.token = token;
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          state.userInfo = userInfo;
        } catch (err) {
          console.log('parse userInfo Error: ', err);
        }
      }
    }
    return state;
  }
  componentDidMount() {
    if (this.state.token) {
      this.fetchUserInfo();
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (!prevState.token && this.state.token) {
      this.fetchUserInfo();
    }
  }
  tryToRefreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    const { token } = this.state;
    const decoded = jwtDecode(token);
    return request('/api/token', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        refreshToken,
        username: decoded.username
      })
    })
      .then(res => {
        this.setState({
          token: res.accessToken
        });
        localStorage.setItem('token', res.accessToken);
        return res.accessToken;
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          this.setState({
            loading: false,
            token: undefined,
            userId: undefined
          });
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      });
  }
  fetchUserInfo() {
    const { token } = this.state;
    this.setState({
      loading: true
    });
    request('/api/user-info', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        console.log('Get UserInfo Success', res);
        this.setState({
          loading: false,
          userInfo: res.user
        });
        const decoded = jwtDecode(token);
        localStorage.setItem(`user_${decoded}`, JSON.stringify(res.user));
      })
      .catch(err => {
        if (err.response && err.response.status === 401) {
          this.tryToRefreshToken().then(token => {
            if (token) {
              this.fetchUserInfo();
            }
          });
        }
      });
  }
  handleLogout = e => {
    const refreshToken = localStorage.getItem('refreshToken');

    request('/api/token/reject', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        refreshToken
      })
    }).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      this.setState({
        token: undefined,
        userInfo: undefined
      });
    });
  };
  handleLoginFormSubmit = e => {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;

    this.setState({
      logining: true,
      loginError: undefined
    });

    request('/api/login', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
      .then(res => {
        this.setState({
          token: res.accessToken
        });
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
      })
      .catch(err => {
        console.dir('Login Failed: ', err);
        if (err.response && err.response.status === 401) {
          this.setState({
            loginError: 'Failed To Authenticated'
          });
        }
      });
  };
  renderProfile() {
    const { userInfo = {}, loading } = this.state;
    return (
      <div className="profile">
        {loading && <div>loading...</div>}
        <ul>
          <li>
            <span>Avatar: </span>
            <img src={userInfo.avatar} />
          </li>
          <li>
            <span>Username: </span>
            {userInfo.username}
          </li>
        </ul>
        <button onClick={this.handleLogout}>Logout</button>
      </div>
    );
  }
  renderLoginForm() {
    const { loginError } = this.state;
    return (
      <div className="formContainer formContainer_login">
        <form className="form" onSubmit={this.handleLoginFormSubmit}>
          <div className="form__row">
            <label htmlFor="usename">Username</label>
            <input className="formInput" name="username" />
          </div>
          <div className="form__row">
            <label htmlFor="usename">Password</label>
            <input className="formInput" name="password" />
          </div>
          <button className="formButton">Login</button>
          {loginError && <div className="errorMsg">{loginError}</div>}
        </form>
      </div>
    );
  }
  render() {
    const { token } = this.state;
    const shouldRenderProfile = Boolean(token);
    if (shouldRenderProfile) {
      return this.renderProfile();
    }
    return this.renderLoginForm();
  }
}

ReactDOM.render(<App />, NODE);
