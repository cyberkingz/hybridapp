const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CodeSessionSchema = new Schema({
  stream: {
    type: Schema.Types.ObjectId,
    ref: 'Stream',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  language: {
    type: String,
    required: true,
    trim: true
  },
  codeContent: {
    type: String,
    default: ''
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  suggestions: [{
    type: Schema.Types.ObjectId,
    ref: 'CodeSuggestion'
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  versionHistory: [{
    version: String,
    codeContent: String,
    timestamp: Date,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Method to add a collaborator
CodeSessionSchema.methods.addCollaborator = function(userId) {
  if (!this.collaborators.includes(userId)) {
    this.collaborators.push(userId);
  }
  return this.save();
};

// Method to remove a collaborator
CodeSessionSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(
    id => id.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add a suggestion reference
CodeSessionSchema.methods.addSuggestion = function(suggestionId) {
  this.suggestions.push(suggestionId);
  return this.save();
};

// Method to update code content
CodeSessionSchema.methods.updateCode = function(newCode, userId) {
  // Save current version to history
  this.versionHistory.push({
    version: this.version,
    codeContent: this.codeContent,
    timestamp: new Date(),
    user: userId
  });
  
  // Update version number
  const versionParts = this.version.split('.');
  const minorVersion = parseInt(versionParts[1]) + 1;
  this.version = `${versionParts[0]}.${minorVersion}`;
  
  // Update code content
  this.codeContent = newCode;
  
  return this.save();
};

// Static method to find public code sessions
CodeSessionSchema.statics.findPublic = function() {
  return this.find({ isPublic: true }).sort({ updatedAt: -1 });
};

// Static method to find by language
CodeSessionSchema.statics.findByLanguage = function(language) {
  return this.find({ language, isPublic: true }).sort({ updatedAt: -1 });
};

module.exports = mongoose.model('CodeSession', CodeSessionSchema);
