let privileges;

function setRolesAndPrivileges(privs) {
  privileges = privs;
}

function hasPrivilege(privilege, collection, db) {
  let privs;

  if (typeof(privileges) != 'undefined') {
    /*Used for System Collections*/
    privs = privileges.inheritedPrivileges.filter((eachPriv) => {
      return eachPriv.resource.collection === collection && (eachPriv.resource.db === db || eachPriv.resource.db === '');
    });

    /*Used for Non System Collections*/
    if (privs.length === 0) {
      privs = privileges.inheritedPrivileges.filter((eachPriv) => {
        return eachPriv.resource.collection === '' && (eachPriv.resource.db === db || eachPriv.resource.db === '');
      });
    }

    let actions = [];
    let innerActions = [];
    if (privs && privs.length > 0) {
      privs.forEach(function(eachPriv) {
        innerActions = eachPriv.actions.filter((eachAction) => {
          return eachAction === privilege;
        });
        actions = actions.concat(innerActions);
      });
    }

    return actions && actions.length > 0;

  } else {
    return true;
  }

}

function hasRole(role, db) {
  let rols;
  if(typeof(privileges) != 'undefined') {
    rols = privileges.roles.filter((eachRole) => {
      return eachRole.db === db && eachRole.role === role;
    });

    return (rols && rols.length > 0);
  } else {
    return true;
  }
}

const privilegesAPI = {
  setRoles : setRolesAndPrivileges,
  hasPrivilege : hasPrivilege,
  hasRole : hasRole
};

export default privilegesAPI;