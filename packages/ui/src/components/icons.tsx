import { ArchiveIcon } from "@radix-ui/react-icons";
import { FaXTwitter } from "react-icons/fa6";
import { FiGithub } from "react-icons/fi";
import { PiDiscordLogo } from "react-icons/pi";

import {
  MdAdd,
  MdArrowBack,
  MdArrowLeft,
  MdArrowRight,
  MdArrowUpward,
  MdAutoAwesome,
  MdBarChart,
  MdChangeHistory,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdCreateNewFolder,
  MdDescription,
  MdDriveFileMove,
  MdEditCalendar,
  MdErrorOutline,
  MdExpandLess,
  MdExpandMore,
  MdFence,
  MdFileUpload,
  MdFolder,
  MdFolderSpecial,
  MdFolderZip,
  MdInventory2,
  MdIosShare,
  MdKeyboardArrowDown,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardArrowUp,
  MdMenu,
  MdMoreHoriz,
  MdOutlineArrowDownward,
  MdOutlineArrowForward,
  MdOutlineAutoAwesome,
  MdOutlineBackspace,
  MdOutlineBrokenImage,
  MdOutlineCancel,
  MdOutlineCategory,
  MdOutlineChatBubbleOutline,
  MdOutlineContentCopy,
  MdOutlineDashboardCustomize,
  MdOutlineDelete,
  MdOutlineDescription,
  MdOutlineEmail,
  MdOutlineExitToApp,
  MdOutlineFace,
  MdOutlineFileDownload,
  MdOutlineForwardToInbox,
  MdOutlineHandyman,
  MdOutlineHourglassTop,
  MdOutlineInbox,
  MdOutlineInsertPhoto,
  MdOutlineIntegrationInstructions,
  MdOutlineInventory2,
  MdOutlineListAlt,
  MdOutlineMoreVert,
  MdOutlineMoveToInbox,
  MdOutlineNotificationsNone,
  MdOutlineOpenInFull,
  MdOutlinePalette,
  MdOutlinePause,
  MdOutlinePlayArrow,
  MdOutlineQuestionAnswer,
  MdOutlineSettings,
  MdOutlineSubject,
  MdOutlineTask,
  MdOutlineTimer,
  MdOutlineTune,
  MdOutlineVisibility,
  MdOutlineVolumeOff,
  MdOutlineVolumeUp,
  MdPause,
  MdPauseCircle,
  MdPeople,
  MdPerson,
  MdPictureAsPdf,
  MdPlayArrow,
  MdPlayCircle,
  MdRefresh,
  MdRemove,
  MdReplay,
  MdRuleFolder,
  MdSearch,
  MdSecurity,
  MdSignalCellularAlt,
  MdSort,
  MdSubdirectoryArrowLeft,
  MdTopic,
  MdTrendingDown,
  MdTrendingUp,
} from "react-icons/md";
export const Icons = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Logo: (props: any) => (
    <svg
      width="36"
      height="40"
      viewBox="0 0 36 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.09899 40C1.06967 40 -0.374188 38.0272 0.239423 36.0929L11.025 2.09288C11.4203 0.846682 12.5771 0 13.8845 0H21.5945C22.9019 0 24.0587 0.846684 24.454 2.09288L35.2396 36.0929C35.8532 38.0272 34.4093 40 32.38 40H3.09899ZM12.1871 28.2964C11.6176 30.2191 13.0584 32.1484 15.0636 32.1484H20.397C22.4023 32.1484 23.843 30.2191 23.2735 28.2964L17.9189 10.219C17.8942 10.1354 17.8174 10.0781 17.7303 10.0781V10.0781C17.6432 10.0781 17.5664 10.1354 17.5417 10.219L12.1871 28.2964Z"
        fill="currentColor"
      />
    </svg>
  ),
  LogoSmall: (props: any) => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" fill="currentColor" />
      <path
        d="M3.71772 32C2.36922 32 1.40718 30.6927 1.8082 29.4052L10.5295 1.40523C10.7898 0.569379 11.5636 0 12.439 0H19.001C19.8764 0 20.6502 0.569381 20.9105 1.40523L29.6318 29.4052C30.0328 30.6927 29.0708 32 27.7223 32H3.71772ZM11.2065 23.1602C10.8343 24.4399 11.7942 25.7187 13.1269 25.7187H18.2987C19.6314 25.7187 20.5913 24.4399 20.2191 23.1602L15.8604 8.1733C15.8413 8.10765 15.7812 8.0625 15.7128 8.0625V8.0625C15.6444 8.0625 15.5843 8.10765 15.5652 8.1733L11.2065 23.1602Z"
        fill="currentColor"
      />
    </svg>
  ),

  X: FaXTwitter,
  Discord: PiDiscordLogo,
  GithubOutline: FiGithub,
  Check: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={17}
      fill="none"
      {...props}
    >
      <path
        fill="currentColor"
        d="m14 5.167-8 8L2.333 9.5l.94-.94L6 11.28l7.06-7.053.94.94Z"
      />
    </svg>
  ),
  Fence: MdFence,
  Inbox: ArchiveIcon,
  Settings: MdOutlineSettings,

  Refresh: MdRefresh,
  Inventory2: MdInventory2,
  Person: MdPerson,
  Peolple: MdPeople,
  Notifications: MdOutlineNotificationsNone,
  ChevronDown: MdExpandMore,
  ChevronUp: MdExpandLess,
  TrendingUp: MdTrendingUp,
  TrendingDown: MdTrendingDown,
  Category: MdOutlineCategory,
  Visibility: MdOutlineVisibility,
  Face: MdOutlineFace,
  MoreHoriz: MdMoreHoriz,
  Pdf: MdPictureAsPdf,
  DriveFileMove: MdDriveFileMove,
  Enter: MdSubdirectoryArrowLeft,
  FolderSpecial: MdFolderSpecial,
  Topic: MdTopic,
  BrokenImage: MdOutlineBrokenImage,
  Description: MdDescription,
  FolderZip: MdFolderZip,
  ChevronRight: MdChevronRight,
  ChevronLeft: MdChevronLeft,
  ArrowLeft: MdArrowLeft,
  ArrowRight: MdArrowRight,
  ArrowDown: MdOutlineArrowDownward,
  ArrowUp: MdArrowUpward,
  ArrowBack: MdArrowBack,
  KeyboardArrowDown: MdKeyboardArrowDown,
  KeyboardArrowUp: MdKeyboardArrowUp,
  KeyboardArrowLeft: MdKeyboardArrowLeft,
  KeyboardArrowRight: MdKeyboardArrowRight,
  ArrowForward: MdOutlineArrowForward,
  Folder: MdFolder,
  FileUpload: MdFileUpload,
  Search: MdSearch,
  CreateNewFolder: MdCreateNewFolder,
  Error: MdErrorOutline,
  OpenInFull: MdOutlineOpenInFull,
  FileDownload: MdOutlineFileDownload,
  Image: MdOutlineInsertPhoto,
  Security: MdSecurity,
  AI: MdAutoAwesome,
  AIOutline: MdOutlineAutoAwesome,
  Tracker: MdOutlineTimer,
  WorkInProgress: MdOutlineHandyman,
  Add: MdAdd,
  DashboardCustomize: MdOutlineDashboardCustomize,
  Copy: MdOutlineContentCopy,
  InboxEmpty: MdOutlineMoveToInbox,
  Share: MdIosShare,
  Cancel: MdOutlineCancel,
  Pending: MdOutlineHourglassTop,
  Play: MdPlayArrow,
  PlayOutline: MdOutlinePlayArrow,
  Pause: MdPause,
  PauseOutline: MdOutlinePause,
  PlayCircle: MdPlayCircle,
  PauseCircle: MdPauseCircle,
  MoreVertical: MdOutlineMoreVert,
  ExitToApp: MdOutlineExitToApp,
  Match: MdOutlineTask,
  Email: MdOutlineEmail,
  QuestionAnswer: MdOutlineQuestionAnswer,
  Click: MdSignalCellularAlt,
  Tune: MdOutlineTune,
  Change: MdChangeHistory,
  Forwarded: MdOutlineForwardToInbox,
  Delete: MdOutlineDelete,
  FolderImports: MdRuleFolder,
  FolderTransactions: MdTopic,
  Calendar: MdEditCalendar,
  Reply: MdReplay,
  Sort: MdSort,
  Backspace: MdOutlineBackspace,
  Palette: MdOutlinePalette,
  Subject: MdOutlineSubject,
  ChatBubble: MdOutlineChatBubbleOutline,
  Menu: MdMenu,
  Mute: MdOutlineVolumeOff,
  UnMute: MdOutlineVolumeUp,
};
