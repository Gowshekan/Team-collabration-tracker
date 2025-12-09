// LocalStorage Data Management (No API - 100% Client-Side)
const STORAGE_KEYS = {
    USERS: 'team_tracker_users',
    PROJECTS: 'team_tracker_projects',
    TASKS: 'team_tracker_tasks'
};

// State Management
let currentUser = null;
let projects = [];
let tasks = [];
let users = [];
let currentView = 'dashboard';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    checkAuth();
    setupEventListeners();
});

// Initialize Data from LocalStorage
function initializeData() {
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
}

// Save Data to LocalStorage
function saveUsers() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function saveProjects() {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

// Generate ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Check Authentication
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
        loadData();
    } else {
        showAuthModal();
    }
}

// Show Auth Modal
function showAuthModal() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('app').classList.add('hidden');
}

// Show App
function showApp() {
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('app').classList.remove('hidden');
    updateUserInfo();
    loadData();
}

// Update User Info in Sidebar
function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role;
        const avatar = document.getElementById('userAvatar');
        avatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Auth Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchAuthTab(tab);
        });
    });

    // Login Form
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    
    // Register Form
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Create Project Buttons
    document.getElementById('createProjectBtn').addEventListener('click', () => openProjectModal());
    document.getElementById('createProjectBtn2').addEventListener('click', () => openProjectModal());

    // Create Task Button
    document.getElementById('createTaskBtn').addEventListener('click', () => openTaskModal());

    // Project Form
    document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);

    // Task Form
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    // Modal Closes
    document.querySelectorAll('.close').forEach(close => {
        close.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    document.getElementById('cancelProjectBtn').addEventListener('click', () => {
        document.getElementById('projectModal').classList.remove('active');
    });

    document.getElementById('cancelTaskBtn').addEventListener('click', () => {
        document.getElementById('taskModal').classList.remove('active');
    });

    // Project Filter
    document.getElementById('projectFilter').addEventListener('change', filterTasks);

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Switch Auth Tab
function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showApp();
        showNotification('Login successful!', 'success');
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

// Handle Register
function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;

    // Check if email already exists
    if (users.find(u => u.email === email)) {
        showNotification('Email already registered', 'error');
        return;
    }

    const newUser = {
        id: generateId(),
        name,
        email,
        password,
        role: role || 'Member',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers();
    showNotification('Registration successful! Please login.', 'success');
    switchAuthTab('login');
    document.getElementById('loginEmail').value = email;
}

// Handle Logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuthModal();
    showNotification('Logged out successfully', 'success');
}

// Switch View
function switchView(view) {
    currentView = view;
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // Update views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });
    document.getElementById(`${view}View`).classList.add('active');

    // Load specific data if needed
    if (view === 'tasks') {
        renderTasks();
    } else if (view === 'projects') {
        renderProjects();
    } else if (view === 'team') {
        loadTeam();
    } else if (view === 'dashboard') {
        loadDashboard();
    }
}

// Load Data
function loadData() {
    loadUsers();
    renderProjects();
    renderTasks();
    loadDashboard();
    loadTeam();
}

// Load Users
function loadUsers() {
    // Users already loaded from localStorage
}

// Render Projects
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    projects.forEach(project => {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const doneTasks = projectTasks.filter(t => t.status === 'Done').length;
        const progressPercentage = projectTasks.length > 0 
            ? Math.round((doneTasks / projectTasks.length) * 100) 
            : 0;

        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-header">
                <div>
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${project.description || 'No description'}</p>
                </div>
            </div>
            <div class="project-meta">
                <div class="project-members">
                    ${project.members.slice(0, 5).map(memberId => {
                        const member = users.find(u => u.id === memberId);
                        if (!member) return '';
                        return `<div class="member-avatar" title="${member.name}">${member.name.charAt(0).toUpperCase()}</div>`;
                    }).join('')}
                    ${project.members.length > 5 ? `<div class="member-avatar">+${project.members.length - 5}</div>` : ''}
                </div>
                <div class="project-progress">${progressPercentage}%</div>
            </div>
            <div class="project-actions">
                ${currentUser.role === 'Admin' || project.adminId === currentUser.id ? 
                    `<button class="action-btn edit" onclick="editProject('${project.id}')">Edit</button>
                     <button class="action-btn delete" onclick="deleteProject('${project.id}')">Delete</button>` : ''}
            </div>
        `;
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.project-actions')) {
                showProjectDetails(project.id);
            }
        });
        grid.appendChild(card);
    });
}

// Render Tasks
function renderTasks() {
    const todoList = document.getElementById('todoTasks');
    const inProgressList = document.getElementById('inProgressTasks');
    const doneList = document.getElementById('doneTasks');

    if (!todoList || !inProgressList || !doneList) return;

    [todoList, inProgressList, doneList].forEach(list => list.innerHTML = '');

    const filteredTasks = filterTasksByProject();
    
    filteredTasks.forEach(task => {
        const taskItem = createTaskItem(task);
        const status = task.status;
        
        if (status === 'To Do') {
            todoList.appendChild(taskItem);
        } else if (status === 'In Progress') {
            inProgressList.appendChild(taskItem);
        } else if (status === 'Done') {
            doneList.appendChild(taskItem);
        }
    });

    setupDragAndDrop();
}

// Filter Tasks by Project
function filterTasksByProject() {
    const projectFilter = document.getElementById('projectFilter')?.value;
    if (!projectFilter) return tasks;
    return tasks.filter(task => task.projectId === projectFilter);
}

// Filter Tasks
function filterTasks() {
    renderTasks();
}

// Create Task Item
function createTaskItem(task) {
    const assignedUser = users.find(u => u.id === task.assignedTo);
    const project = projects.find(p => p.id === task.projectId);
    
    const item = document.createElement('div');
    item.className = 'task-item';
    item.draggable = true;
    item.dataset.taskId = task.id;
    item.dataset.status = task.status;
    
    item.innerHTML = `
        <div class="task-item-header">
            <h4 class="task-title">${task.title}</h4>
        </div>
        <p class="task-description">${task.description || 'No description'}</p>
        <div class="task-meta">
            <span class="task-assigned">Assigned to: ${assignedUser ? assignedUser.name : 'Unknown'}</span>
            <div class="task-actions">
                <button class="task-action-btn" onclick="editTask('${task.id}')" title="Edit">✏️</button>
                ${currentUser.role === 'Admin' ? 
                    `<button class="task-action-btn" onclick="deleteTask('${task.id}')" title="Delete">🗑️</button>` : ''}
            </div>
        </div>
    `;

    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);

    return item;
}

// Setup Drag and Drop
function setupDragAndDrop() {
    const taskLists = document.querySelectorAll('.task-list');
    
    taskLists.forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('drop', handleDrop);
        list.addEventListener('dragenter', handleDragEnter);
        list.addEventListener('dragleave', handleDragLeave);
    });
}

// Drag and Drop Handlers
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

async function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement) {
        const newStatus = this.dataset.status;
        const taskId = draggedElement.dataset.taskId;
        
        updateTaskStatus(taskId, newStatus);
        draggedElement.remove();
    }
    
    this.classList.remove('drag-over');
    return false;
}

// Update Task Status
function updateTaskStatus(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = newStatus;
    task.updatedAt = new Date().toISOString();
    saveTasks();
    renderTasks();
    loadDashboard();
    showNotification('Task status updated', 'success');
}

// Load Dashboard
function loadDashboard() {
    const totalProjects = projects.length;
    const totalTasks = tasks.length;
    
    const todoCount = tasks.filter(t => t.status === 'To Do').length;
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const doneCount = tasks.filter(t => t.status === 'Done').length;
    
    const progressPercentage = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
    
    const totalProjectsEl = document.getElementById('totalProjects');
    const totalTasksEl = document.getElementById('totalTasks');
    const progressPercentageEl = document.getElementById('progressPercentage');
    const progressBar = document.getElementById('overallProgressBar');
    const todoCountEl = document.getElementById('todoCount');
    const inProgressCountEl = document.getElementById('inProgressCount');
    const doneCountEl = document.getElementById('doneCount');
    
    if (totalProjectsEl) totalProjectsEl.textContent = totalProjects;
    if (totalTasksEl) totalTasksEl.textContent = totalTasks;
    if (progressPercentageEl) progressPercentageEl.textContent = `${progressPercentage}%`;
    if (progressBar) progressBar.style.width = `${progressPercentage}%`;
    if (todoCountEl) todoCountEl.textContent = todoCount;
    if (inProgressCountEl) inProgressCountEl.textContent = inProgressCount;
    if (doneCountEl) doneCountEl.textContent = doneCount;
}

// Load Team
function loadTeam() {
    const grid = document.getElementById('teamGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'team-member-card';
        card.innerHTML = `
            <div class="team-member-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <h3 class="team-member-name">${user.name}</h3>
            <p class="team-member-role">${user.role}</p>
            <p class="team-member-email">${user.email}</p>
        `;
        grid.appendChild(card);
    });
}

// Open Project Modal
function openProjectModal(projectId = null) {
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const title = document.getElementById('projectModalTitle');
    
    if (projectId) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            title.textContent = 'Edit Project';
            document.getElementById('projectId').value = project.id;
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectDescription').value = project.description || '';
            populateMembersSelect(project.members || []);
        }
    } else {
        title.textContent = 'Create New Project';
        form.reset();
        document.getElementById('projectId').value = '';
        populateMembersSelect([]);
    }
    
    modal.classList.add('active');
}

// Populate Members Select
function populateMembersSelect(selectedMembers = []) {
    const container = document.getElementById('membersSelect');
    if (!container) return;
    
    container.innerHTML = '';

    users.forEach(user => {
        const checkbox = document.createElement('div');
        checkbox.className = 'member-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" id="member-${user.id}" value="${user.id}" 
                   ${selectedMembers.includes(user.id) ? 'checked' : ''}>
            <label for="member-${user.id}">${user.name} (${user.role})</label>
        `;
        container.appendChild(checkbox);
    });
}

// Handle Project Submit
function handleProjectSubmit(e) {
    e.preventDefault();
    const projectId = document.getElementById('projectId').value;
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDescription').value;
    const selectedMembers = Array.from(document.querySelectorAll('#membersSelect input:checked'))
        .map(cb => cb.value);

    if (projectId) {
        // Update existing project
        const project = projects.find(p => p.id === projectId);
        if (project) {
            project.name = name;
            project.description = description;
            project.members = selectedMembers;
            project.updatedAt = new Date().toISOString();
            saveProjects();
            document.getElementById('projectModal').classList.remove('active');
            renderProjects();
            loadDashboard();
            showNotification('Project updated successfully', 'success');
        }
    } else {
        // Create new project
        const newProject = {
            id: generateId(),
            name,
            description,
            adminId: currentUser.id,
            members: selectedMembers,
            createdAt: new Date().toISOString()
        };
        projects.push(newProject);
        saveProjects();
        document.getElementById('projectModal').classList.remove('active');
        renderProjects();
        loadDashboard();
        showNotification('Project created successfully', 'success');
    }
}

// Edit Project
function editProject(projectId) {
    openProjectModal(projectId);
}

// Delete Project
function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? All tasks will also be deleted.')) {
        return;
    }

    projects = projects.filter(p => p.id !== projectId);
    tasks = tasks.filter(t => t.projectId !== projectId);
    saveProjects();
    saveTasks();
    renderProjects();
    renderTasks();
    loadDashboard();
    showNotification('Project deleted successfully', 'success');
}

// Show Project Details
function showProjectDetails(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const projectMembers = project.members.map(memberId => users.find(u => u.id === memberId)).filter(Boolean);
    
    const modal = document.getElementById('projectDetailsModal');
    const content = document.getElementById('projectDetailsContent');
    
    content.innerHTML = `
        <h2>${project.name}</h2>
        <p style="color: var(--text-secondary); margin: 16px 0;">${project.description || 'No description'}</p>
        <div style="margin: 24px 0;">
            <h3>Team Members (${projectMembers.length})</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px;">
                ${projectMembers.map(member => 
                    `<div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-color); border-radius: 8px;">
                        <div class="member-avatar">${member.name.charAt(0).toUpperCase()}</div>
                        <span>${member.name} (${member.role})</span>
                    </div>`
                ).join('')}
            </div>
        </div>
        <div style="margin: 24px 0;">
            <h3>Tasks (${projectTasks.length})</h3>
            <div style="margin-top: 12px;">
                ${projectTasks.length === 0 ? '<p style="color: var(--text-secondary);">No tasks yet</p>' : 
                    projectTasks.map(task => {
                        const assignedUser = users.find(u => u.id === task.assignedTo);
                        return `
                            <div style="padding: 12px; background: var(--bg-color); border-radius: 8px; margin-bottom: 8px; border-left: 4px solid ${getStatusColor(task.status)};">
                                <strong>${task.title}</strong> - ${task.status}
                                <br>
                                <small style="color: var(--text-secondary);">Assigned to: ${assignedUser ? assignedUser.name : 'Unknown'}</small>
                            </div>
                        `;
                    }).join('')}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Get Status Color
function getStatusColor(status) {
    const colors = {
        'To Do': 'var(--warning-color)',
        'In Progress': 'var(--primary-color)',
        'Done': 'var(--success-color)'
    };
    return colors[status] || 'var(--text-secondary)';
}

// Open Task Modal
function openTaskModal(taskId = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const title = document.getElementById('taskModalTitle');
    
    // Populate project select
    const projectSelect = document.getElementById('taskProjectId');
    projectSelect.innerHTML = '<option value="">Select Project</option>';
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
    });
    
    // Populate assigned to select
    const assignedSelect = document.getElementById('taskAssignedTo');
    assignedSelect.innerHTML = '<option value="">Select Member</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.role})`;
        assignedSelect.appendChild(option);
    });
    
    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskProjectId').value = task.projectId;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskAssignedTo').value = task.assignedTo;
            document.getElementById('taskStatus').value = task.status;
        }
    } else {
        title.textContent = 'Create New Task';
        form.reset();
        document.getElementById('taskId').value = '';
    }
    
    modal.classList.add('active');
}

// Handle Task Submit
function handleTaskSubmit(e) {
    e.preventDefault();
    const taskId = document.getElementById('taskId').value;
    const projectId = document.getElementById('taskProjectId').value;
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const assignedTo = document.getElementById('taskAssignedTo').value;
    const status = document.getElementById('taskStatus').value;

    if (taskId) {
        // Update existing task
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.title = title;
            task.description = description;
            task.assignedTo = assignedTo;
            task.status = status;
            task.updatedAt = new Date().toISOString();
            saveTasks();
            document.getElementById('taskModal').classList.remove('active');
            renderTasks();
            loadDashboard();
            showNotification('Task updated successfully', 'success');
        }
    } else {
        // Create new task
        const newTask = {
            id: generateId(),
            title,
            description,
            projectId,
            assignedTo,
            status: status || 'To Do',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(newTask);
        saveTasks();
        document.getElementById('taskModal').classList.remove('active');
        renderTasks();
        loadDashboard();
        showNotification('Task created successfully', 'success');
    }
}

// Edit Task
function editTask(taskId) {
    openTaskModal(taskId);
}

// Delete Task
function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    loadDashboard();
    showNotification('Task deleted successfully', 'success');
}

// Update Project Filter
function updateProjectFilter() {
    const filter = document.getElementById('projectFilter');
    if (!filter) return;
    
    filter.innerHTML = '<option value="">All Projects</option>';
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        filter.appendChild(option);
    });
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${type === 'success' ? '✓' : '✕'}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Update project filter when projects change
function loadData() {
    loadUsers();
    renderProjects();
    renderTasks();
    loadDashboard();
    loadTeam();
    updateProjectFilter();
}
