jest.mock('../../../gateway/service');
import LoginComponent from '../LoginComponent.jsx';
import ReactDOM from 'react-dom'
//import renderer from 'react-test-renderer';
import TestUtils from 'react-addons-test-utils';
import React from 'react';
import $ from 'jquery';

describe('LoginComponent => ', function() {
	var loginComponent, loginNode;
	beforeAll(function(){
		var obj = {
			query:{
				code:''
			}
		};
		loginComponent = TestUtils.renderIntoDocument(
	    	<LoginComponent location={obj}></LoginComponent>
	  );
	  loginNode = ReactDOM.findDOMNode(loginComponent);
	});

	xit('Renders LoginComponent', () => {
		const component = renderer.create(
		    <LoginComponent></LoginComponent>
		    );
		var tree = component.toJSON();
		expect(tree).toMatchSnapshot();
	});

	it('LoginComponent should have form element', () => {
	  expect(loginNode.querySelectorAll('form').length).toBe(1);
	});

	it('LoginComponent state should not change', () => {
		expect(loginComponent.state).toBeDefined();
		expect(loginComponent.state.host).toBeDefined();
		expect(loginComponent.state.port).toBeDefined();
		expect(loginComponent.state.username).toBeDefined();
		expect(loginComponent.state.password).toBeDefined();
		expect(loginComponent.state.message).toBeDefined();
		expect(loginComponent.state.canSubmit).toBeDefined();
		expect(loginComponent.state.connectionId).toBeDefined();
	});

	it('LoginComponent should have folowing methods defined', () => {
		//console.log(loginComponent);
		//console.log($(loginNode.querySelectorAll('form')).serialize());

	  expect(loginComponent.onSubmit).toBeDefined();
	  expect(loginComponent.success).toBeDefined();
	  expect(loginComponent.failure).toBeDefined();
	  expect(loginComponent.getRequest).toBeDefined();
	});
});	
