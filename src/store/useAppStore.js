import { create } from "zustand";
import axios from "axios";

const useAppStore = create((set, get) => ({
  // Users list used by admin/user management
  users: [],
  setUsers: (users) => set({ users }),
  loading: true,
  setLoading: (loading) => set({ loading }),
  selectedUser: null,
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // Auth slice
  user: null,
  setUser: (user) => set({ user }),
  authLoading: true,
  setAuthLoading: (authLoading) => set({ authLoading }),

  loginAction: async (usernameOrEmail, password) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/login", { usernameOrEmail, password });
      set({ user: data.user });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Login failed" };
    }
  },

  registerAction: async (username, email, password) => {
    try {
      const { data } = await axios.post("http://localhost:5000/api/auth/register", { username, email, password });
      set({ user: data.user });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Registration failed" };
    }
  },

  logoutAction: () => {
    set({ user: null });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common['Authorization'];
  },

  updateUser: (next) => {
    set({ user: next });
    if (next) localStorage.setItem("user", JSON.stringify(next));
    else localStorage.removeItem("user");
  },

  // Dark mode
  darkMode: typeof window !== "undefined" && localStorage.getItem("theme") === "dark",
  setDarkMode: (darkMode) => {
    set({ darkMode });
    try {
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark-mode", darkMode);
        document.body.classList.toggle("dark-mode", darkMode);
      }
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    } catch (e) {
      // ignore in non-browser environments
    }
  },

  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  allTasks: [],
  setAllTasks: (allTasks) => set({ allTasks }),
  privateTasks: [],
  setPrivateTasks: (privateTasks) => set({ privateTasks }),
  
  // Teams
  teams: [],
  setTeams: (teams) => set({ teams }),
  
  // Team Manager Dashboard state (component-scoped keys)
  managedTeams: [],
  setManagedTeams: (managedTeams) => set({ managedTeams }),
  selectedTeam: null,
  setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
  teamTasks: [],
  setTeamTasks: (teamTasks) => set({ teamTasks }),
  teamManagerLoading: false,
  setTeamManagerLoading: (teamManagerLoading) => set({ teamManagerLoading }),
  teamManagerError: null,
  setTeamManagerError: (teamManagerError) => set({ teamManagerError }),

  // Team Management component-scoped state (prefixed to avoid collisions)
  teamMgmt_showForm: false,
  setTeamMgmt_showForm: (v) => set({ teamMgmt_showForm: v }),
  teamMgmt_editingTeam: null,
  setTeamMgmt_editingTeam: (v) => set({ teamMgmt_editingTeam: v }),
  teamMgmt_selectedTeamDetail: null,
  setTeamMgmt_selectedTeamDetail: (v) => set({ teamMgmt_selectedTeamDetail: v }),
  teamMgmt_showChatModal: false,
  setTeamMgmt_showChatModal: (v) => set({ teamMgmt_showChatModal: v }),
  teamMgmt_chatTarget: null,
  setTeamMgmt_chatTarget: (v) => set({ teamMgmt_chatTarget: v }),
  teamMgmt_users: [],
  setTeamMgmt_users: (v) => set({ teamMgmt_users: v }),
  teamMgmt_selectedUsers: [],
  setTeamMgmt_selectedUsers: (v) => set({ teamMgmt_selectedUsers: v }),
  teamMgmt_selectedManagers: [],
  setTeamMgmt_selectedManagers: (v) => set({ teamMgmt_selectedManagers: v }),
  teamMgmt_searchTerm: "",
  setTeamMgmt_searchTerm: (v) => set({ teamMgmt_searchTerm: v }),
  teamMgmt_managerSearchTerm: "",
  setTeamMgmt_managerSearchTerm: (v) => set({ teamMgmt_managerSearchTerm: v }),
  teamMgmt_teamSearchTerm: "",
  setTeamMgmt_teamSearchTerm: (v) => set({ teamMgmt_teamSearchTerm: v }),
  teamMgmt_form: { name: "", description: "" },
  setTeamMgmt_form: (v) => set({ teamMgmt_form: v }),
  teamMgmt_page: 1,
  setTeamMgmt_page: (v) => set({ teamMgmt_page: v }),
  
  // TaskList component-scoped state (prefixed)
  taskList_showRecurrentEnd: false,
  setTaskList_showRecurrentEnd: (v) => set({ taskList_showRecurrentEnd: v }),
  taskList_endedTaskTitle: "",
  setTaskList_endedTaskTitle: (v) => set({ taskList_endedTaskTitle: v }),
  taskList_notifiedRecurrentTasks: JSON.parse(localStorage.getItem("notifiedRecurrentTasks") || "[]"),
  setTaskList_notifiedRecurrentTasks: (v) => {
    set({ taskList_notifiedRecurrentTasks: v });
    localStorage.setItem("notifiedRecurrentTasks", JSON.stringify(v));
  },
  taskList_expandedTask: null,
  setTaskList_expandedTask: (v) => set({ taskList_expandedTask: v }),
  taskList_selectedTask: null,
  setTaskList_selectedTask: (v) => set({ taskList_selectedTask: v }),
  taskList_commentInputs: {},
  setTaskList_commentInputs: (v) => set({ taskList_commentInputs: v }),
  taskList_mentionDropdowns: {},
  setTaskList_mentionDropdowns: (v) => set({ taskList_mentionDropdowns: v }),
  taskList_mentionDropdownSelected: {},
  setTaskList_mentionDropdownSelected: (v) => set({ taskList_mentionDropdownSelected: v }),
  taskList_editingComment: null,
  setTaskList_editingComment: (v) => set({ taskList_editingComment: v }),
  taskList_editText: "",
  setTaskList_editText: (v) => set({ taskList_editText: v }),
  taskList_logTaskId: null,
  setTaskList_logTaskId: (v) => set({ taskList_logTaskId: v }),
  taskList_users: [],
  setTaskList_users: (v) => set({ taskList_users: v }),
  taskList_page: 1,
  setTaskList_page: (v) => set({ taskList_page: v }),
  
  // TaskForm component-scoped state
  taskForm_users: [],
  setTaskForm_users: (v) => set({ taskForm_users: v }),
  taskForm_assignmentType: "user",
  setTaskForm_assignmentType: (v) => set({ taskForm_assignmentType: v }),
  taskForm_userSearchTerm: "",
  setTaskForm_userSearchTerm: (v) => set({ taskForm_userSearchTerm: v }),
  taskForm_teamSearchTerm: "",
  setTaskForm_teamSearchTerm: (v) => set({ taskForm_teamSearchTerm: v }),
  taskForm_showUserDropdown: false,
  setTaskForm_showUserDropdown: (v) => set({ taskForm_showUserDropdown: v }),
  taskForm_showTeamDropdown: false,
  setTaskForm_showTeamDropdown: (v) => set({ taskForm_showTeamDropdown: v }),
  taskForm_files: [],
  setTaskForm_files: (v) => set({ taskForm_files: v }),
  taskForm_fileError: "",
  setTaskForm_fileError: (v) => set({ taskForm_fileError: v }),
  taskForm_uploading: false,
  setTaskForm_uploading: (v) => set({ taskForm_uploading: v }),
  taskForm_form: { title: "", description: "", status: "todo", priority: "medium", dueDate: "", assignedTo: "", assignedToTeam: "", recurrencePattern: "none", recurrenceEndDate: "" },
  setTaskForm_form: (v) => set({ taskForm_form: v }),
  taskForm_isPrivate: false,
  setTaskForm_isPrivate: (v) => set({ taskForm_isPrivate: v }),
  taskForm_privateKey: "",
  setTaskForm_privateKey: (v) => set({ taskForm_privateKey: v }),
  taskForm_privateKeyError: "",
  setTaskForm_privateKeyError: (v) => set({ taskForm_privateKeyError: v }),

  // TaskBoard component-scoped state
  taskBoard_taskSearchTerm: "",
  setTaskBoard_taskSearchTerm: (v) => set({ taskBoard_taskSearchTerm: v }),
  taskBoard_statusFilter: "All",
  setTaskBoard_statusFilter: (v) => set({ taskBoard_statusFilter: v }),
  taskBoard_priorityFilter: "All Priority",
  setTaskBoard_priorityFilter: (v) => set({ taskBoard_priorityFilter: v }),
  taskBoard_userFilter: "All Users",
  setTaskBoard_userFilter: (v) => set({ taskBoard_userFilter: v }),
  taskBoard_showForm: false,
  setTaskBoard_showForm: (v) => set({ taskBoard_showForm: v }),
  taskBoard_users: [],
  setTaskBoard_users: (v) => set({ taskBoard_users: v }),
  taskBoard_showPrivateSection: false,
  setTaskBoard_showPrivateSection: (v) => set({ taskBoard_showPrivateSection: v }),
  taskBoard_securityKey: "",
  setTaskBoard_securityKey: (v) => set({ taskBoard_securityKey: v }),
  taskBoard_privateKeyEntered: false,
  setTaskBoard_privateKeyEntered: (v) => set({ taskBoard_privateKeyEntered: v }),
  
  // Conversations component state
  conv_userTeams: [],
  setConv_userTeams: (v) => set({ conv_userTeams: v }),
  conv_selectedTeam: null,
  setConv_selectedTeam: (v) => set({ conv_selectedTeam: v }),
  conv_activeConv: null,
  setConv_activeConv: (v) => set({ conv_activeConv: v }),

  // Chat component state
  chat_conversation: null,
  setChat_conversation: (v) => set({ chat_conversation: v }),
  chat_messages: [],
  setChat_messages: (v) => set({ chat_messages: v }),
  chat_text: "",
  setChat_text: (v) => set({ chat_text: v }),
  chat_displayUser: null,
  setChat_displayUser: (v) => set({ chat_displayUser: v }),
  
  // Leaderboard component state
  leaderboard_activeTab: "teams",
  setLeaderboard_activeTab: (v) => set({ leaderboard_activeTab: v }),
  leaderboard_teamLeaderboard: [],
  setLeaderboard_teamLeaderboard: (v) => set({ leaderboard_teamLeaderboard: v }),
  leaderboard_memberLeaderboard: [],
  setLeaderboard_memberLeaderboard: (v) => set({ leaderboard_memberLeaderboard: v }),
  leaderboard_loading: false,
  setLeaderboard_loading: (v) => set({ leaderboard_loading: v }),
  leaderboard_error: null,
  setLeaderboard_error: (v) => set({ leaderboard_error: v }),
  leaderboard_currentPage: 1,
  setLeaderboard_currentPage: (v) => set({ leaderboard_currentPage: v }),

  // Login component state
  login_form: { usernameOrEmail: "", password: "" },
  setLogin_form: (v) => set({ login_form: v }),
  login_error: "",
  setLogin_error: (v) => set({ login_error: v }),
  login_loading: false,
  setLogin_loading: (v) => set({ login_loading: v }),
  
  // Navbar component state
  navbar_expandTasks: false,
  setNavbar_expandTasks: (v) => set({ navbar_expandTasks: v }),

  // Profile component state
  profile_profile: null,
  setProfile_profile: (v) => set({ profile_profile: v }),
  profile_loading: true,
  setProfile_loading: (v) => set({ profile_loading: v }),
  profile_error: null,
  setProfile_error: (v) => set({ profile_error: v }),
  profile_mentions: [],
  setProfile_mentions: (v) => set({ profile_mentions: v }),

  // Activity component state
  activity_activities: [],
  setActivity_activities: (v) => set({ activity_activities: v }),
  activity_loading: true,
  setActivity_loading: (v) => set({ activity_loading: v }),
  activity_userFilter: "All Users",
  setActivity_userFilter: (v) => set({ activity_userFilter: v }),
  activity_users: [],
  setActivity_users: (v) => set({ activity_users: v }),

  // Analytics component state
  analytics_chartType: "pie",
  setAnalytics_chartType: (v) => set({ analytics_chartType: v }),
  analytics_userFilter: "All Users",
  setAnalytics_userFilter: (v) => set({ analytics_userFilter: v }),
  analytics_users: [],
  setAnalytics_users: (v) => set({ analytics_users: v }),
  analytics_exportFormat: "csv",
  setAnalytics_exportFormat: (v) => set({ analytics_exportFormat: v }),
  analytics_showExportModal: false,
  setAnalytics_showExportModal: (v) => set({ analytics_showExportModal: v }),

  // TaskDetailModal component state
  taskDetail_commentText: "",
  setTaskDetail_commentText: (v) => set({ taskDetail_commentText: v }),
  taskDetail_editingComment: null,
  setTaskDetail_editingComment: (v) => set({ taskDetail_editingComment: v }),
  taskDetail_editText: "",
  setTaskDetail_editText: (v) => set({ taskDetail_editText: v }),
  taskDetail_deletingAttachment: null,
  setTaskDetail_deletingAttachment: (v) => set({ taskDetail_deletingAttachment: v }),
  taskDetail_users: [],
  setTaskDetail_users: (v) => set({ taskDetail_users: v }),
  taskDetail_mentionDropdown: { show: false, search: "", pos: { left: 0, top: 40 } },
  setTaskDetail_mentionDropdown: (v) => set({ taskDetail_mentionDropdown: v }),
  taskDetail_mentionDropdownSelected: 0,
  setTaskDetail_mentionDropdownSelected: (v) => set({ taskDetail_mentionDropdownSelected: v }),

  // SearchableSelect component state (generic, reusable)
  searchable_isOpen: false,
  setSearchable_isOpen: (v) => set({ searchable_isOpen: v }),
  searchable_searchTerm: "",
  setSearchable_searchTerm: (v) => set({ searchable_searchTerm: v }),

  // SignUp component state
  signup_form: { username: "", email: "", password: "" },
  setSignup_form: (v) => set({ signup_form: v }),
  signup_error: "",
  setSignup_error: (v) => set({ signup_error: v }),
  signup_loading: false,
  setSignup_loading: (v) => set({ signup_loading: v }),
}));

export default useAppStore;
