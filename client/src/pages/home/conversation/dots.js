import React, { Component } from 'react';

class dots extends Component {
    constructor(props) {
        super(props);
        this.state = {  }
    }
    render() { 
        return ( 
            <>
             <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </>
         );
    }
}
 
export default dots;