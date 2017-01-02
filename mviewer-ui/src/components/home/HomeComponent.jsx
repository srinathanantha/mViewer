import React from 'react';
import homeStyles from './home.css';
import CreateDb from '../create-db/CreateDbComponent.jsx';

class HomeComponent extends React.Component {

  constructor(props) {
    super(props);
  }

  refreshDb = () =>{
    this.props.refreshDb('.');
  }
  render () {
    return(
      <div className={homeStyles.mainContainer + ' container col-lg-10 col-sm-9 col-xs-8 col-md-9'}>
        <CreateDb fromHome = {this.props} refreshDb={this.refreshDb}></CreateDb>
      </div>
    );
  }
}

HomeComponent.propTypes = {
  refreshDb : React.PropTypes.func
};

export default HomeComponent;
