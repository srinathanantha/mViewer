import React from 'react'
import homeStyles from './home.css'
import $ from 'jquery'
import CreateDb from '../createdb/CreateDbComponent.jsx'

class HomeComponent extends React.Component {
  render () {
    return(
      <div className={homeStyles.mainContainer+' container col-lg-10 col-sm-9 col-xs-8 col-md-9'}>
        <CreateDb fromHome = {this.props} refreshDb={this.props.refreshDb.bind(this)}></CreateDb>
      </div>
    );
  }
}

export default HomeComponent;
