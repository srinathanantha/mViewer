import React from 'react';
/*eslint-disable */
import toolTip from '../shared/tool-tip.js';
/*eslint-enable */
import UserListStyles from '../shared/list-panel.css';

class UserItemComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hoverFlag : false
    };
  }

  onClick = () => {
    this.props.onClick(this.props.idx, this.props.name);
  }

  render () {
    return (
      <div onClick={this.onClick} value={this.props.name} className={(this.props.isSelected ? UserListStyles.menuItem + ' ' + UserListStyles.highlight : UserListStyles.menuItem)} key={this.props.name} >
        <span className = {UserListStyles.collectionIcon}>
          <i className="fa fa-user" aria-hidden="true"></i>
        </span>
        <span id="toolTip" className = {UserListStyles.button}>{this.props.name}</span>
      </div>
    );
  }
}
UserItemComponent.getDefaultProps = {
  isSelected : false
};
UserItemComponent.propTypes = {
  onClick : React.PropTypes.func.isRequired,
  isSelected : React.PropTypes.bool
};
UserItemComponent.propTypes = {
  idx : React.PropTypes.number,
  name : React.PropTypes.string,
};

export default UserItemComponent;
