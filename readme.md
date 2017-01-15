# Payment Handler

Updates payment information for our organization from an external payment notification listener. Does this by connecting to this external service by way of a socket.io connection. When a payment is received this service updates our mongo payments database. This service is also responsible for making sure that payments events are reflected in internal systems like access control, or our workshop management interface

### Using payment hander

    #/bin/bash

    # nano start.sh # Paste in this script
    # control-x and y to save
    # chmod +x start.sh
    # ./start.sh to run payment handler
    # npm install -g pm2 # install process management system

    export PORT="3001"
    export MONGODB_URI="mongodb://localhost/makerspacepayments"
    export PAYMENT_NOTIFICATION_SERVER="https://yourPaymentListener.herokuapp.com/"

    npm install
    pm2 start payment_handler.js

Copyright 2017 ~ Manchester Makerspace ~ MIT License
