/** @format */

document.addEventListener('DOMContentLoaded', () => {
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let state = {
    filterBy: { status: 'all', priority: 'all', search: '' },
    sortBy: 'dueDate',
    sortOrder: 'asc',
  };
  let taskToDelete = null;

  const priorityMap = {
    high: { value: 3, classes: 'badge-error badge-outline' },
    medium: { value: 2, classes: 'badge-warning badge-outline' },
    low: { value: 1, classes: 'badge-ghost' },
  };

  const searchInput = document.getElementById('search-input');
  const taskList = document.getElementById('task-list');
  const sortOrderToggle = document.getElementById('sort-order-toggle');
  const sortAscIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" /></svg>`;
  const sortDescIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25.75L17.25 15m0 0L21 12.75M17.25 15V3" /></svg>`;

  const saveTasks = () => localStorage.setItem('tasks', JSON.stringify(tasks));

  const showAlert = (message, type = 'success') => {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} shadow-lg animate-fade-in`;
    alert.innerHTML = `<span>${message}</span>`;
    alertContainer.appendChild(alert);
    setTimeout(() => {
      alert.classList.add('animate-fade-out');
      alert.addEventListener('animationend', () => alert.remove());
    }, 3000);
  };

  const navigateTo = (pageId, isInitialLoad = false) => {
    document
      .querySelectorAll('.page')
      .forEach((p) => p.classList.add('hidden'));
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.remove('hidden');
      // Remove margin/padding for home page, add for others
      if (pageId === 'home-page') {
        page.classList.remove('pt-16', 'mt-8');
      } else {
        page.classList.add('pt-16', 'mt-8');
      }
    }
    document.querySelectorAll('.nav-link, .nav-link-mobile').forEach((l) => {
      l.classList.toggle('active', l.dataset.page === pageId);
    });
    document.body.style.overflow = 'auto';
    if (!isInitialLoad) {
      document.getElementById('my-drawer-3').checked = false;
    }
    if (pageId === 'stats-page') renderStats();
    if (pageId === 'home-page' && isInitialLoad) {
      setupScrollAnimations();
      setupMouseParallax();
    }
  };

  const renderTasks = () => {
    let tasksToRender = [...tasks];
    tasksToRender = tasksToRender
      .filter(
        (task) =>
          (state.filterBy.status === 'all' ||
            (state.filterBy.status === 'completed'
              ? task.completed
              : !task.completed)) &&
          (state.filterBy.priority === 'all' ||
            task.priority === state.filterBy.priority) &&
          (task.title.toLowerCase().includes(state.filterBy.search) ||
            task.description.toLowerCase().includes(state.filterBy.search)),
      )
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const valA =
          state.sortBy === 'dueDate'
            ? new Date(a.dueDate)
            : priorityMap[a.priority].value;
        const valB =
          state.sortBy === 'dueDate'
            ? new Date(b.dueDate)
            : priorityMap[b.priority].value;
        if (valA < valB) return state.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return state.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

    taskList.innerHTML = '';
    if (tasksToRender.length === 0) {
      taskList.innerHTML = `<div class="text-center p-8"><p class="text-lg">No tasks here.</p></div>`;
      return;
    }

    tasksToRender.forEach((task) => {
      const isOverdue =
        !task.completed &&
        new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0);
      const taskElement = document.createElement('div');
      taskElement.className = `card ${
        task.completed ? 'bg-base-300 text-base-content/60' : 'bg-base-200'
      } shadow-md transition-all duration-300 animate-fade-in`;
      taskElement.dataset.taskId = task.id;
      taskElement.innerHTML = `
          <div class="card-body">
              <div class="flex items-start gap-4">
                  <input type="checkbox" class="checkbox checkbox-primary mt-1" ${
                    task.completed ? 'checked' : ''
                  } data-action="toggle">
                  <div class="flex-grow min-w-0">
                      <div class="flex justify-between items-start gap-2">
                          <h2 class="card-title truncate pr-2">${
                            task.title
                          }</h2>
                          <div class="card-actions flex-nowrap">
                              <button class="btn btn-ghost btn-sm btn-square" data-action="edit" aria-label="Edit task"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg></button>
                              <button class="btn btn-ghost btn-sm btn-square text-error" data-action="delete" aria-label="Delete task"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                          </div>
                      </div>
                      <p class="text-sm line-clamp-2 mt-1">${
                        task.description
                      }</p>
                      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                          <span class="flex items-center gap-1 ${
                            isOverdue ? 'text-error font-semibold' : ''
                          }">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" /></svg>
                              ${task.dueDate}
                          </span>
                          <span class="badge ${
                            priorityMap[task.priority].classes
                          } capitalize">${task.priority}</span>
                      </div>
                  </div>
              </div>
          </div>`;
      taskList.appendChild(taskElement);
    });
  };

  const renderStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const overdue = tasks.filter(
      (t) =>
        !t.completed && new Date(t.dueDate) < new Date().setHours(0, 0, 0, 0),
    ).length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById(
      'stats-overview',
    ).innerHTML = `<div class="stat"><div class="stat-figure text-primary"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></div><div class="stat-title">Total Tasks</div><div class="stat-value">${total}</div><div class="stat-desc">All tasks created</div></div><div class="stat"><div class="stat-figure text-success"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg></div><div class="stat-title">Completed</div><div class="stat-value">${completed}</div><div class="stat-desc">${
      total > 0 ? Math.round((completed / total) * 100) : 0
    }% of all tasks</div></div><div class="stat"><div class="stat-figure text-error"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg></div><div class="stat-title">Overdue</div><div class="stat-value">${overdue}</div><div class="stat-desc">Tasks past their due date</div></div>`;
    document.getElementById(
      'stats-completion-rate',
    ).innerHTML = `<h2 class="card-title">Completion Rate</h2><div class="radial-progress text-success mt-4" style="--value:${completionRate}; --size:12rem; --thickness: 1rem;" role="progressbar"><span class="text-base-content text-3xl font-bold">${completionRate}%</span></div>`;

    let priorityHtml = '';
    Object.keys(priorityMap)
      .reverse()
      .forEach((p) => {
        const count = tasks.filter((t) => t.priority === p).length;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        priorityHtml += `<div><div class="flex justify-between items-center text-sm mb-1"><span class="font-semibold capitalize">${p}</span><span>${count} tasks (${percentage}%)</span></div><progress class="progress ${
          p === 'high'
            ? 'progress-error'
            : p === 'medium'
            ? 'progress-warning'
            : 'progress-info'
        } w-full" value="${count}" max="${total || 1}"></progress></div>`;
      });
    document.getElementById('stats-priority').innerHTML = priorityHtml;
  };

  const setupScrollAnimations = () => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll('.reveal').forEach((el) => {
      observer.observe(el);
    });
  };

  const setupMouseParallax = () => {
    const heroSection = document.getElementById('hero-section');
    const heroContent = document.getElementById('hero-content');
    if (!heroSection || !heroContent) return;

    heroSection.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const { offsetWidth, offsetHeight } = heroSection;
      const x = (clientX / offsetWidth - 0.5) * 2;
      const y = (clientY / offsetHeight - 0.5) * 2;
      const rotateY = x * 4;
      const rotateX = y * -4;

      heroContent.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`;
    });

    heroSection.addEventListener('mouseleave', () => {
      heroContent.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
    });
  };

  const updateSortToggleIcon = () => {
    sortOrderToggle.innerHTML =
      state.sortOrder === 'asc' ? sortAscIcon : sortDescIcon;
  };

  window.openTaskModal = (task = null) => {
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    if (task) {
      document.getElementById('modal-title').textContent = 'Edit task';
      document.getElementById('task-id').value = task.id;
      document.getElementById('task-title').value = task.title;
      document.getElementById('task-due-date').value = task.dueDate;
      document.getElementById('task-priority').value = task.priority;
      Object.keys(task).forEach((key) => {
        const el = document.getElementById(`task-${key}`);
        if (el && key === 'description') {
          el.parentElement.querySelector('textarea').value = task[key];
        } else if (el) {
          el.value = task[key];
        }
      });
    } else {
      document.getElementById('modal-title').textContent = 'Add New Task';
      document.getElementById('task-due-date').value = new Date()
        .toISOString()
        .split('T')[0];
    }
    task_modal.showModal();
  };

  document.addEventListener('keydown', (e) => {
    // Check if typing in an input/textarea to prevent conflicts
    const activeEl = document.activeElement;
    if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') closeAllModals();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      openTaskModal();
    }
    if (e.key === 'Escape') {
      closeAllModals();
    }

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = ''; // Clear the visual input
        state.filterBy.search = ''; // Clear the search term in the state
        renderTasks(); // Re-render the list without the search filter
        searchInput.blur(); // Remove focus from the input field
      }
    });
  });

  document
    .querySelectorAll('.get-started-btn')
    .forEach((btn) =>
      btn.addEventListener('click', () => navigateTo('tasks-page')),
    );
  document.querySelectorAll('.nav-link, .nav-link-mobile').forEach((link) =>
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(e.target.dataset.page);
    }),
  );

  document.getElementById('task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const taskData = {
      title: document.getElementById('task-title').value.trim(),
      description: document.getElementById('task-description').value.trim(),
      dueDate: document.getElementById('task-due-date').value,
      priority: document.getElementById('task-priority').value,
    };
    if (id) {
      const taskIndex = tasks.findIndex((t) => t.id == id);
      if (taskIndex > -1)
        tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
    } else {
      tasks.push({ id: Date.now(), completed: false, ...taskData });
    }
    saveTasks();
    renderTasks();
    task_modal.close();
  });

  taskList.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const taskId = target.closest('.card').dataset.taskId;
    const task = tasks.find((t) => t.id == taskId);
    if (action === 'toggle') {
      if (task) {
        const wasCompleted = task.completed;
        task.completed = !task.completed;
        if (task.completed && !wasCompleted) {
          showAlert(`Task "${task.title}" marked as complete!`);
        }
        saveTasks();
        renderTasks();
      }
    } else if (action === 'edit') {
      openTaskModal(task);
    } else if (action === 'delete') {
      taskToDelete = taskId;
      delete_confirm_modal.showModal();
    }
  });

  document
    .getElementById('confirm-delete-btn')
    .addEventListener('click', () => {
      if (taskToDelete) {
        tasks = tasks.filter((t) => t.id != taskToDelete);
        saveTasks();
        renderTasks();
        showAlert('Task has been deleted.', 'error');
        taskToDelete = null;
      }
      delete_confirm_modal.close();
    });

  const syncMobileFilters = () => {
    document.getElementById('mobile-filter-status').value =
      state.filterBy.status;
    document.getElementById('mobile-filter-priority').value =
      state.filterBy.priority;
  };
  document.getElementById('filter-status').addEventListener('change', (e) => {
    state.filterBy.status = e.target.value;
    syncMobileFilters();
    renderTasks();
  });
  document.getElementById('filter-priority').addEventListener('change', (e) => {
    state.filterBy.priority = e.target.value;
    syncMobileFilters();
    renderTasks();
  });
  document
    .getElementById('mobile-filter-status')
    .addEventListener('change', (e) => {
      state.filterBy.status = e.target.value;
      document.getElementById('filter-status').value = e.target.value;
      renderTasks();
    });
  document
    .getElementById('mobile-filter-priority')
    .addEventListener('change', (e) => {
      state.filterBy.priority = e.target.value;
      document.getElementById('filter-priority').value = e.target.value;
      renderTasks();
    });

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.filterBy.search = e.target.value.toLowerCase();
      renderTasks();
    }, 250);
  });

  document.getElementById('sort-by').addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderTasks();
  });
  sortOrderToggle.addEventListener('click', () => {
    state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    updateSortToggleIcon();
    renderTasks();
  });

  document
    .getElementById('clear-all-tasks-btn')
    .addEventListener('click', () => {
      settings_modal.close();
      clear_all_confirm_modal.showModal();
    });
  document
    .getElementById('confirm-clear-all-btn')
    .addEventListener('click', () => {
      tasks = [];
      saveTasks();
      renderTasks();
      showAlert('All tasks have been cleared.', 'info');
      if (document.getElementById('stats-page').offsetParent !== null) {
        renderStats();
      }
      clear_all_confirm_modal.close();
    });

  navigateTo('home-page', true);
  updateSortToggleIcon();
  renderTasks();
});
