require('ts-node/register')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const asPromised = require('chai-as-promised')

chai.should()
chai.use(sinonChai)
chai.use(asPromised)
