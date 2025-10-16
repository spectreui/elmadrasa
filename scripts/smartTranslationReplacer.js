// scripts/smartTranslationReplacer.js
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// Your translation map (extracted from your files)
const translationMap = {
  // Dashboard
  'Loading your dashboard...': 'dashboard.loading',
  'Overview': 'dashboard.overview',
  'Active Exams': 'dashboard.activeExams',
  'Currently running': 'dashboard.currentlyRunning',
  'Students': 'dashboard.students', 
  'Total enrolled': 'dashboard.totalEnrolled',
  'Avg. Score': 'dashboard.avgScore',
  'Class average': 'dashboard.classAverage',
  'Engagement': 'dashboard.engagement',
  'Student activity': 'dashboard.studentActivity',
  'Quick Actions': 'dashboard.quickActions',
  'Create Exam': 'dashboard.createExam',
  'Design new assessment': 'dashboard.designAssessment',
  'Assign Work': 'dashboard.assignWork',
  'Create homework': 'dashboard.createHomework',
  'My Classes': 'dashboard.myClasses',
  'Manage students': 'dashboard.manageStudents',
  'Analytics': 'dashboard.analytics',
  'View insights': 'dashboard.viewInsights',
  'Recent Activity': 'dashboard.recentActivity',
  'View All': 'common.viewAll',
  'No recent activity': 'dashboard.noRecentActivity',
  'Your recent activities will appear here': 'dashboard.noActivityMessage',
  'Performance Insights': 'dashboard.performanceInsights',
  'Classes': 'dashboard.classes',
  'Subjects': 'dashboard.subjects',
  'Avg. Response': 'dashboard.avgResponse',

  // Profile
  'Profile': 'profile.title',
  'Settings': 'profile.settings',
  'Teacher Information': 'profile.teacherInformation',
  'Active': 'common.active',
  'Teacher ID': 'profile.teacherId',
  'Email': 'profile.email',
  'Account Created': 'profile.accountCreated',
  'Teaching Overview': 'profile.teachingOverview',
  'Exams Created': 'profile.examsCreated',
  'To Grade': 'profile.toGrade',
  'Class Performance': 'profile.classPerformance',
  'Average Class Score': 'profile.averageClassScore',
  'Student Engagement': 'profile.studentEngagement',
  'Notification Settings': 'notifications.settings',
  'General Notifications': 'notifications.general',
  'App notifications and updates': 'notifications.generalDesc',
  'Exam Alerts': 'notifications.examAlerts',
  'Exam completion notifications': 'notifications.examAlertsDesc',
  'Grading Reminders': 'notifications.gradingReminders',
  'Pending grading alerts': 'notifications.gradingRemindersDesc',
  'System Preferences': 'system.preferences',
  'Dark Mode': 'system.darkMode',
  'Enable dark theme': 'system.darkModeDesc',
  'Teacher Tools': 'tools.title',
  'Export Student Data': 'tools.exportData',
  'Class Analytics': 'tools.classAnalytics',
  'Teaching Resources': 'tools.teachingResources',
  'Sign Out': 'auth.logOut',
  'Are you sure you want to sign out?': 'auth.signOutConfirm',

  // Homework
  'New Homework': 'homework.new',
  'Create assignment with questions': 'homework.createAssignment',
  'Assignment Details': 'homework.assignmentDetails',
  'Title *': 'homework.titleRequired',
  'Enter homework title': 'homework.titlePlaceholder',
  'Description': 'homework.description',
  'Enter homework description and instructions...': 'homework.descriptionPlaceholder',
  'Class *': 'homework.classRequired',
  'Select class': 'homework.selectClass',
  'Subject *': 'homework.subjectRequired',
  'Select subject': 'homework.selectSubject',
  'Select class first': 'homework.selectClassFirst',
  'Schedule': 'homework.schedule',
  'Start Date *': 'homework.startDateRequired',
  'Due Date *': 'homework.dueDateRequired',
  'Select date': 'homework.selectDate',
  'Total Points': 'homework.totalPoints',
  'Include Questions': 'homework.includeQuestions',
  'Add questions for students to answer': 'homework.includeQuestionsDesc',
  'Allow Attachments': 'homework.allowAttachments',
  'Students can upload files with their submission': 'homework.allowAttachmentsDesc',
  'Questions': 'homework.questions',
  'Add': 'common.add',
  'Question Text': 'homework.questionText',
  'Enter your question...': 'homework.questionPlaceholder',
  'Question Type': 'homework.questionType',
  'Text Answer': 'homework.textAnswer',
  'Multiple Choice': 'homework.multipleChoice',
  'Options': 'homework.options',
  'Add Option': 'homework.addOption',
  'Points': 'homework.points',
  'Assign Homework': 'homework.assign',
  'Missing Information': 'homework.missingInfo',
  'Please fill in all required fields': 'homework.fillRequiredFields',
  'Invalid Date': 'homework.invalidDate',
  'Please enter valid start and due dates': 'homework.enterValidDates',
  'Invalid Date Range': 'homework.invalidDateRange',
  'Start date must be before due date': 'homework.startBeforeDue',
  'Invalid Points': 'homework.invalidPoints',
  'Points must be between 1 and 100': 'homework.pointsRange',
  'Invalid Question': 'homework.invalidQuestion',
  'All questions must have text': 'homework.questionsNeedText',
  'Multiple choice questions must have at least 2 options': 'homework.mcqMinOptions',
  'All options must have text': 'homework.optionsNeedText',
  'No answer provided': 'homework.noAnswerProvided',

  // Submissions
  'Submissions': 'submissions.title',
  'Back': 'common.back',
  'Submitted': 'submissions.submitted',
  'Graded': 'submissions.graded',
  'Pending': 'common.pending',
  'Avg Grade': 'submissions.avgGrade',
  'No Submissions Yet': 'submissions.none',
  'Students haven\'t submitted this homework yet': 'submissions.noneMessage',
  'Grade Submission': 'submissions.grade',
  'Edit Grade': 'submissions.editGrade',
  'Student\'s Submission Content': 'submissions.studentContent',
  'No content provided': 'submissions.noContent',
  'Questions & Student Answers': 'submissions.questionsAnswers',
  'Student\'s Answer': 'submissions.studentAnswer',
  'No answer provided': 'submissions.noAnswer',
  'Attachments': 'submissions.attachments',
  'Overall Grade': 'submissions.overallGrade',
  'Text Submission': 'submissions.textSubmission',
  'Question Points': 'submissions.questionPoints',
  'Overall Feedback': 'submissions.overallFeedback',
  'Graded on': 'submissions.gradedOn',
  'Submitted on': 'submissions.submittedOn',

  // Classes
  'My Classes': 'classes.myClasses',
  'Classes and subjects you teach': 'classes.subtitle',
  'No classes assigned': 'classes.none',
  'Contact your administrator to get assigned to classes and subjects.': 'classes.noneMessage',
  'Join Code': 'classes.joinCode',
  'Tap to copy and share with students': 'classes.tapToCopy',
  'No join code available': 'classes.noCode',

  // Exams
  'Create New Exam': 'exams.create',
  'Edit Exam': 'exams.edit',
  'Exam Details': 'exams.details',
  'Exam Title': 'exams.title',
  'Exam Settings': 'exams.settings',
  'Timed Exam': 'exams.timed',
  'Set time limit for exam': 'exams.timedDesc',
  'Duration (minutes)': 'exams.duration',
  'Allow Retake': 'exams.allowRetake',
  'Students can retake exam': 'exams.allowRetakeDesc',
  'Random Order': 'exams.randomOrder',
  'Shuffle questions order': 'exams.randomOrderDesc',
  'Advanced Options': 'exams.advancedOptions',
  'Allow Image Submissions': 'exams.allowImageSubmissions',
  'Students can submit photos of paper answers': 'exams.allowImageSubmissionsDesc',
  'Exam Attachment (Optional)': 'exams.attachment',
  'Add PDF/Image Attachment': 'exams.addAttachment',
  'Uploading...': 'exams.uploading',
  'Available From': 'exams.availableFrom',
  'Select available date/time': 'exams.selectAvailableDate',
  'Select due date': 'exams.selectDueDate',
  'Please complete all questions': 'exams.completeAllQuestions',
  'Available date must be before due date': 'exams.dateRangeError',

  // Common
  'Error': 'common.error',
  'Success': 'common.success',
  'Loading...': 'common.loading',
  'Cancel': 'common.cancel',
  'Save': 'common.save',
  'Edit': 'common.edit',
  'Delete': 'common.delete',
  'Create': 'common.create',
  'Update': 'common.update',
  'Submit': 'common.submit',
  'Confirm': 'common.confirm',
  'Next': 'common.next',
  'Previous': 'common.previous',
  'Search': 'common.search',
  'Filter': 'common.filter',
  'Sort': 'common.sort'
};

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse the AST
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    let hasTranslations = false;
    let hasUseTranslation = false;

    // Check if useTranslation is already imported
    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value.includes('useTranslation')) {
          hasUseTranslation = true;
        }
      }
    });

    // Replace JSX text with {t('key')}
    traverse(ast, {
      JSXText(path) {
        const value = path.node.value.trim();
        
        if (value && translationMap[value]) {
          const translationKey = translationMap[value];
          
          // Create the JSX expression {t('key')}
          const callExpression = t.callExpression(
            t.identifier('t'),
            [t.stringLiteral(translationKey)]
          );
          
          const jsxExpression = t.jsxExpressionContainer(callExpression);
          path.replaceWith(jsxExpression);
          hasTranslations = true;
          
          console.log(`   🔄 Replaced: "${value}" -> {t('${translationKey}')}`);
        }
      },

      StringLiteral(path) {
        const { value } = path.node;
        
        if (translationMap[value]) {
          const translationKey = translationMap[value];
          
          // Only replace if it's in a JSX context (not in imports, etc.)
          if (isInJsxContext(path)) {
            const callExpression = t.callExpression(
              t.identifier('t'),
              [t.stringLiteral(translationKey)]
            );
            
            path.replaceWith(callExpression);
            hasTranslations = true;
            
            console.log(`   🔄 Replaced: "${value}" -> {t('${translationKey}')}`);
          }
        }
      },

      TemplateLiteral(path) {
        // Handle template literals with single text
        if (path.node.quasis.length === 1 && path.node.expressions.length === 0) {
          const value = path.node.quasis[0].value.raw.trim();
          
          if (value && translationMap[value]) {
            const translationKey = translationMap[value];
            const callExpression = t.callExpression(
              t.identifier('t'),
              [t.stringLiteral(translationKey)]
            );
            
            path.replaceWith(callExpression);
            hasTranslations = true;
            
            console.log(`   🔄 Replaced: "${value}" -> {t('${translationKey}')}`);
          }
        }
      }
    });

    // Add useTranslation import if needed
    if (hasTranslations && !hasUseTranslation) {
      addUseTranslationImport(ast);
      console.log(`   📥 Added useTranslation import`);
    }

    // Add useTranslation hook call in components
    if (hasTranslations) {
      const addedHook = addUseTranslationHook(ast);
      if (addedHook) {
        console.log(`   ⚓ Added useTranslation hook`);
      }
    }

    // Generate new code
    const output = generate(ast, { 
      retainLines: true,
      comments: true,
      concise: false
    }, content);

    // Write back only if changes were made
    if (hasTranslations) {
      fs.writeFileSync(filePath, output.code, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  No changes: ${filePath}`);
    }
    
    return hasTranslations;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function isInJsxContext(path) {
  let currentPath = path;
  while (currentPath) {
    if (currentPath.isJSXAttribute() || currentPath.isJSXElement()) {
      return true;
    }
    currentPath = currentPath.parentPath;
  }
  return false;
}

function addUseTranslationImport(ast) {
  const useTranslationImport = t.importDeclaration(
    [
      t.importSpecifier(
        t.identifier('useTranslation'),
        t.identifier('useTranslation')
      )
    ],
    t.stringLiteral('@/hooks/useTranslation')
  );

  // Find the last import and insert after it
  let lastImport = null;
  traverse(ast, {
    ImportDeclaration(path) {
      lastImport = path;
    }
  });

  if (lastImport) {
    lastImport.insertAfter(useTranslationImport);
  } else {
    // Insert at top if no imports
    ast.program.body.unshift(useTranslationImport);
  }
}

function addUseTranslationHook(ast) {
  let hookAdded = false;
  
  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id && /^[A-Z]/.test(path.node.id.name)) { // React component (starts with capital)
        const body = path.get('body');
        if (body.isBlockStatement()) {
          // Check if hook already exists
          const hasHook = body.node.body.some(node => 
            node.type === 'VariableDeclaration' &&
            node.declarations.some(decl =>
              decl.init && 
              decl.init.type === 'CallExpression' &&
              decl.init.callee.name === 'useTranslation'
            )
          );
          
          if (!hasHook) {
            // Add useTranslation hook at the beginning of function
            const hookStatement = t.variableDeclaration('const', [
              t.variableDeclarator(
                t.objectPattern([
                  t.objectProperty(
                    t.identifier('t'),
                    t.identifier('t'),
                    false,
                    true
                  )
                ]),
                t.callExpression(t.identifier('useTranslation'), [])
              )
            ]);

            body.node.body.unshift(hookStatement);
            hookAdded = true;
          }
        }
      }
    },
    
    ArrowFunctionExpression(path) {
      if (path.parent.type === 'VariableDeclarator' && 
          /^[A-Z]/.test(path.parent.id.name)) { // React component
        const body = path.get('body');
        
        if (body.isBlockStatement()) {
          // Check if hook already exists
          const hasHook = body.node.body.some(node => 
            node.type === 'VariableDeclaration' &&
            node.declarations.some(decl =>
              decl.init && 
              decl.init.type === 'CallExpression' &&
              decl.init.callee.name === 'useTranslation'
            )
          );
          
          if (!hasHook) {
            // Add useTranslation hook at the beginning of function
            const hookStatement = t.variableDeclaration('const', [
              t.variableDeclarator(
                t.objectPattern([
                  t.objectProperty(
                    t.identifier('t'),
                    t.identifier('t'),
                    false,
                    true
                  )
                ]),
                t.callExpression(t.identifier('useTranslation'), [])
              )
            ]);

            body.node.body.unshift(hookStatement);
            hookAdded = true;
          }
        }
      }
    }
  });
  
  return hookAdded;
}

function scanDirectory(directory) {
  const files = [];
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && 
          !item.includes('node_modules') && 
          !item.includes('.git') &&
          !item.includes('scripts') &&
          !item.includes('locales')) {
        walkDir(fullPath);
      } else if (stat.isFile() && /\.(tsx|jsx)$/.test(item)) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(directory);
  
  console.log(`🔍 Found ${files.length} React component files to process...\n`);
  
  let processedFiles = 0;
  let totalReplacements = 0;
  
  for (const file of files) {
    console.log(`\n📄 Processing: ${file}`);
    const hasChanges = processFile(file);
    if (hasChanges) {
      processedFiles++;
      totalReplacements++;
    }
  }
  
  console.log('\n🎉 Translation replacement complete!');
  console.log(`📊 Summary:`);
  console.log(`   Files processed: ${processedFiles}/${files.length}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Create the useTranslation hook in src/hooks/useTranslation.ts`);
  console.log(`   2. Create locale files in src/locales/en.json and src/locales/ar.json`);
  console.log(`   3. Wrap your app with TranslationProvider`);
}

// Install required dependencies first:
console.log(`
📦 Required dependencies (run this first):
npm install @babel/parser @babel/traverse @babel/generator @babel/types

🚀 Usage:
node scripts/smartTranslationReplacer.js [directory]

💡 Example:
node scripts/smartTranslationReplacer.js ./app
`);

// Run the script
const targetDir = process.argv[2] || './app';
if (fs.existsSync(targetDir)) {
  scanDirectory(targetDir);
} else {
  console.log(`❌ Directory ${targetDir} not found!`);
  console.log(`💡 Please specify a valid directory path`);
}