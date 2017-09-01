import React from 'react';
import styles from './login.css';
import { Form } from 'formsy-react';
import TextInput from '../login-text-input/LoginTextInputComponent.jsx';
import $ from 'jquery';
import service from '../../gateway/service.js';
import { browserHistory} from 'react-router';

class LoginComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      host : '',
      port : '',
      username : '',
      password : '',
      hostError : false,
      portError : false,
      userNameError : false,
      passwordError : false,
      dbError : false,
      databases : '',
      canSubmit : false,
      message : '',
      connectionId : '',
      authEnabled : false,
      loading : false,
      rememberMe : false,
      connections : []
    };
    this.onSubmit = this.onSubmit.bind(this);
    this.success = this.success.bind(this);
    this.failure = this.failure.bind(this);
  }

  handleCheck = () => {
    this.setState({
      authEnabled : !this.state.authEnabled,
      username : '',
      password : '',
      databases : '',
      userNameError : false,
      passwordError : false,
      dbError : false
    });
    this.refs.username.clearCss();
    this.refs.password.clearCss();
    this.refs.database.clearCss();
  }

  rememberMeCheck = () => {
    this.setState({rememberMe : !this.state.rememberMe});
  }

  loadLoginData() {
    if(localStorage.getItem('loginData')) {
      let loginObject = JSON.parse(localStorage.getItem('loginData'));
      if (loginObject && loginObject.length > 0) {
        this.setState(loginObject[0]);
        this.setState({rememberMe : true});
        this.setState({connections : loginObject});
      }
    }
  }

  onSubmit() {
    var data = $('form').serialize().split('&');
    var obj = {};
    var loginData = {};
    let hostError = false;
    let portError = false;
    let userNameError = false;
    let passwordError = false;
    let dbError = false;
    let loginDataArr = [];

    if(this.state.host == null || this.state.host === '')
      hostError = true;

    if(this.state.port == null || this.state.port === '')
      portError = true;

    if(this.state.authEnabled) {
      if(this.state.username == null || this.state.username === '')
        userNameError = true;

      if(this.state.password == null || this.state.password === '')
        passwordError = true;

      if(this.state.databases == null || this.state.databases === '')
        dbError = true;
    }

    this.setState({
      hostError : hostError,
      portError : portError,
      userNameError : userNameError,
      passwordError : passwordError,
      dbError : dbError
    });

    if(hostError || portError || userNameError || passwordError || dbError)
      return false;
    for(let key in data) {
      obj[data[key].split('=')[0]] = data[key].split('=')[1];
    }

    this.setState({
      loading : true,
      message : ''
    });

    loginData = { 'host' : this.state.host, 'port' : this.state.port, 'username' : this.state.username,
      'password' : this.state.password, 'databases' : this.state.databases, 'authEnabled' : this.state.authEnabled};
    if(this.state.rememberMe) {
      let found = false;
      if (localStorage.getItem('loginData')) {
        loginDataArr = JSON.parse(localStorage.getItem('loginData'));
        loginDataArr = loginDataArr.map(function(eachItem) {
          if (eachItem.host === loginData.host) {
            found = true;
            return loginData;
          }
          return eachItem;
        });
      }
      if (!found) {
        loginDataArr.push(loginData);
      }
      localStorage.setItem('loginData', JSON.stringify(loginDataArr));
    } else {
      if (localStorage.getItem('loginData')) {
        loginDataArr = JSON.parse(localStorage.getItem('loginData'));
        loginDataArr = loginDataArr.filter(function(eachItem) {
          return (eachItem.host !== loginData.host);
        });
      }
      localStorage.setItem('loginData', JSON.stringify(loginDataArr));
    }

    let loginCall = service('POST', 'login', obj);
    loginCall.then(this.success, this.failure);

    return loginCall;
  }

  success(data) {
    if (data.response.result) {
      sessionStorage.setItem('connectionId', JSON.stringify(data.response.result.connectionId));
      sessionStorage.setItem('username', JSON.stringify(this.state.username));
      sessionStorage.setItem('host', JSON.stringify(this.state.host));
      sessionStorage.setItem('db', JSON.stringify(this.state.databases));
      this.setState({
        message : data.response.result['success'],
        loading : false
      });
      browserHistory.push({ pathname : '/dashboard/home', query : { database : this.state.databases} });
    }
    if (data.response.error) {
      this.setState({
        message : data.response.error.message,
        loading : false
      });
    }
  }

  failure() {
    this.setState({
      message : 'Unexpected Error Occurred',
      loading : false
    });
  }

  enableButton() {
    return function() {
      this.setState({
        canSubmit : true
      });
    }.bind(this);
  }

  disableButton() {
    return function() {
      this.setState({
        canSubmit : false
      });
    }.bind(this);
  }

  handleChange(key) {
    return function(e) {
      var state = {};
      state[key] = e;
      this.setState(state);
    }.bind(this);
  }

  componentDidMount() {
    this.loadLoginData();
  }

  connectionChange(e) {
    this.setState(this.state.connections[e.target.selectedIndex]);
  }

  getConnections() {
    if (this.state.connections.length > 0) {
      let options = this.state.connections.map((eachConn, index) => {
        return <option key={index}>{eachConn.host}
        </option>;
      });

      return <select className={styles.connections} onChange={this.connectionChange.bind(this)}>{options}</select>;
    } else {
      return '';
    }
  }

  render() {
    let connections = this.getConnections();

    return (
      <section className={styles.loginForm}>
        <div className={styles.parentDiv + ' ' + styles.clearfix}>

           <div className={styles.two}>
             <div className ={styles.one}> <img src={'/images/logo.png'} className={styles.logo}></img></div>
            <Form method='POST' onValid={this.enableButton()} onSubmit={this.onSubmit} onInvalid={this.disableButton()} >
              <div className={ styles.formContainer}>
                {connections &&
                  <div>
                    {connections}
                  </div>
                }
                <div className={styles.inputBoxLogin}>
                  <TextInput type="text" name="host" id="host" placeholder="host" value={this.state.host} onChange={this.handleChange( 'host')} validations={'isRequired1:' + this.state.hostError} validationErrors={{isRequired1 : 'Host must not be empty' }} shouldBeDisabled ={this.state.loading} checked={this.state.rememberMe} />
                </div>
                <div className={styles.inputBoxLogin}>
                  <TextInput type="text" name="port" id="port" placeholder="port" value={this.state.port} onChange={this.handleChange( 'port')} validations={{isRequired1 : this.state.portError, isNumeric : true}} validationErrors={{isRequired1 : 'Port must not be empty', isNumeric : 'Inavlid Port number' }} shouldBeDisabled ={this.state.loading} checked={this.state.rememberMe} />
                </div>
                <div className={styles.inputBoxLogin + ' ' + styles.checkBox}>
                  <span className={styles.checkLabel} onClick ={this.handleCheck}>Perform Authentication</span>
                  <input type="checkbox" className={styles.checkboxClass} name="auth" id="auth" onChange={this.handleCheck} checked={this.state.authEnabled} disabled ={this.state.loading} />
                </div>
                <div className={styles.inputBoxLogin}>
                  <TextInput ref="username" type="text" name="username" id="username" placeholder="username" value={this.state.username} onChange={this.handleChange( 'username')} shouldBeDisabled={!this.state.authEnabled || this.state.loading} validations={'isRequired1:' + this.state.userNameError} validationErrors={{isRequired1 : 'User name must not be empty' }} checked={this.state.rememberMe}/>
                </div>
                <div className={styles.inputBoxLogin}>
                  <TextInput ref="password" type="password" name="password" id="password" placeholder="password" value={this.state.password} onChange={this.handleChange( 'password')} shouldBeDisabled={!this.state.authEnabled || this.state.loading} validations={'isRequired1:' + this.state.passwordError} validationErrors={{isRequired1 : 'Password must not be empty' }} checked={this.state.rememberMe}/>
                </div>
                <div className={styles.inputBoxLogin}>
                  <TextInput ref="database" type="text" name="databases" id="databases" placeholder="database" value={this.state.databases} onChange={this.handleChange( 'databases')} shouldBeDisabled={!this.state.authEnabled || this.state.loading} validations={'isRequired1:' + this.state.dbError} validationErrors={{isRequired1 : 'DB name must not be empty'}} checked={this.state.rememberMe}/>
                </div>
                <div className={styles.submitContainer}>
                  {this.state.loading === true ? <div className={styles.loader}></div> : null}
                  <input type="submit" value={this.state.loading === true ? 'Connecting..' : 'CONNECT' } disabled={!this.state.canSubmit || this.state.loading} className={ styles.gobutton} />
                </div>
                <div className={styles.footerLink}>
                  <input type="checkbox" className={styles.rememberClass} name="rememberMe" id="rememberMe" onChange={this.rememberMeCheck} checked={this.state.rememberMe}/>
                  <div className={styles.rememberLabel} onClick ={this.rememberMeCheck} ><span>Remember Me</span></div>
                  <a target = "_blank" href='http://Imaginea.github.io/mViewer'>Need Help?</a>
                </div>
                <div className={styles.errorMessage + ' ' + (typeof(this.state.message) != 'undefined' && this.state.message !== '' && this.state.message !== 'Login Success' ? styles.show : styles.hidden)}>{this.state.message}</div>
              </div>
            </Form>
          </div>
        </div>
      </section>
    );
  }
}

LoginComponent.propTypes = {
  location : React.PropTypes.object.isRequired
};

export default LoginComponent;