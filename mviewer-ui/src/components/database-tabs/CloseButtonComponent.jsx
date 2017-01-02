import React from 'react';
import closeButtonStyles from './database-tabs.css';
class CloseButtonComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  closeButtonHandler = () => {
    this.props.closeButtonHandler(this.props.key1);
  }

  render() {
    return (
      <span onClick = {this.closeButtonHandler} className={closeButtonStyles.buttonContainer}>
        <i className="fa fa-times" aria-hidden="true"></i>
      </span>);
  }
}

CloseButtonComponent.propTypes = {
  key1 : React.PropTypes.string,
  closeButtonHandler : React.PropTypes.func
};

export default CloseButtonComponent;