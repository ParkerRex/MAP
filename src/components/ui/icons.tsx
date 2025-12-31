import { ArchiveIcon } from "@radix-ui/react-icons";
import type { SVGProps } from "react";

import { FaXTwitter } from "react-icons/fa6";
import { FiGithub } from "react-icons/fi";

type IconProps = SVGProps<SVGSVGElement>;

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
import { PiDiscordLogo } from "react-icons/pi";
export const Icons = {
  LogoSmall: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={29} height={32} fill="none" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M2.71772 32C1.36922 32 0.407184 30.6927 0.808204 29.4052L9.5295 1.40523C9.78985 0.569379 10.5636 0 11.439 0H18.001C18.8764 0 19.6502 0.569381 19.9105 1.40523L28.6318 29.4052C29.0328 30.6927 28.0708 32 26.7223 32H2.71772ZM10.2065 23.1602C9.83428 24.4399 10.7942 25.7188 12.1269 25.7188H17.2987C18.6314 25.7188 19.5913 24.4399 19.2191 23.1602L14.8604 8.1733C14.8413 8.10765 14.7812 8.0625 14.7128 8.0625C14.6444 8.0625 14.5843 8.10765 14.5652 8.1733L10.2065 23.1602Z"
        clipRule="evenodd"
      />
    </svg>
  ),
  LogoIcon: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={17} fill="none" {...props}>
      <path
        d="M1.36818 17C0.691203 17 0.209852 16.3414 0.415386 15.6964L5.19505 0.696397C5.32722 0.281622 5.71253 0 6.14785 0H9.85215C10.2875 0 10.6728 0.281621 10.805 0.696396L15.5846 15.6964C15.7901 16.3414 15.3088 17 14.6318 17H1.36818ZM5.52495 12.3779C5.3342 13.0191 5.81451 13.6631 6.48343 13.6631H9.50873C10.1776 13.6631 10.658 13.0191 10.4672 12.3779L8.07668 4.34331C8.06607 4.30765 8.03329 4.2832 7.99608 4.2832V4.2832C7.95887 4.2832 7.92609 4.30765 7.91548 4.34331L5.52495 12.3779Z"
        fill="#221810"
      />
    </svg>
  ),
  Logo: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={88} height={28} fill="none" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M0.821833 28C0.266327 28 -0.128927 27.4817 0.0390147 26.9734L8.77012 0.549963C8.87833 0.222494 9.19502 0 9.55294 0H17.1743C17.5323 0 17.8489 0.222492 17.9572 0.549961L26.6883 26.9734C26.8562 27.4817 26.4609 28 25.9054 28H0.821833ZM8.79549 21.4918C8.63962 21.997 9.03402 22.5039 9.58293 22.5039H17.131C17.6799 22.5039 18.0743 21.997 17.9184 21.4918L13.4945 7.15327C13.4764 7.0948 13.4205 7.05469 13.3569 7.05469V7.05469C13.2934 7.05469 13.2375 7.0948 13.2194 7.15327L8.79549 21.4918Z"
      />
      <path
        fill="currentColor"
        d="M72.5289 23.0668C72.2433 23.0668 72.0117 22.8411 72.0117 22.5626V4.50417C72.0117 4.22573 72.2433 4 72.5289 4H80.455C81.9067 4 83.177 4.27929 84.2658 4.8379C85.3547 5.3965 86.2016 6.18163 86.8064 7.19331C87.4114 8.205 87.7138 9.38736 87.7138 10.7404C87.7138 12.1059 87.4017 13.2882 86.7778 14.2875C86.1602 15.2868 85.2909 16.0563 84.1703 16.5965C83.056 17.1364 81.7539 17.4063 80.264 17.4063H75.7382C75.4525 17.4063 75.221 17.1806 75.221 16.9021V13.8886C75.221 13.6102 75.4525 13.3844 75.7382 13.3844H79.1942C79.8181 13.3844 80.3498 13.2789 80.7893 13.0679C81.235 12.8507 81.5757 12.5434 81.8112 12.1462C82.0531 11.749 82.1741 11.2804 82.1741 10.7404C82.1741 10.1942 82.0531 9.72873 81.8112 9.34392C81.5757 8.9529 81.235 8.65498 80.7893 8.45016C80.3498 8.23913 79.8181 8.13362 79.1942 8.13362H77.8393C77.5537 8.13362 77.3221 8.35934 77.3221 8.63779V22.5626C77.3221 22.8411 77.0906 23.0668 76.8049 23.0668H72.5289Z"
      />
      <path
        fill="currentColor"
        d="M60.176 22.6905C60.104 22.9144 59.8911 23.0668 59.6504 23.0668H55.7397C55.3629 23.0668 55.0973 22.7064 55.2178 22.3584L61.4476 4.36517C61.5231 4.14694 61.7331 4 61.9695 4H67.4743C67.7106 4 67.9206 4.14694 67.9962 4.36517L74.2259 22.3584C74.3464 22.7064 74.0808 23.0668 73.704 23.0668H69.7931C69.5525 23.0668 69.3397 22.9146 69.2676 22.6908L64.8164 8.87498C64.8028 8.8327 64.7626 8.80394 64.7171 8.80394V8.80394C64.6716 8.80394 64.6314 8.83273 64.6178 8.87504L60.176 22.6905ZM59.3767 16.0998C59.3767 15.8033 59.6233 15.563 59.9275 15.563H69.4494C69.7536 15.563 70.0002 15.8033 70.0002 16.0998V18.5267C70.0002 18.8232 69.7536 19.0635 69.4494 19.0635H59.9275C59.6233 19.0635 59.3767 18.8232 59.3767 18.5267V16.0998Z"
      />
      <path
        fill="currentColor"
        d="M35 4.50417C35 4.22573 35.2189 4 35.489 4H40.9207C41.119 4 41.2977 4.12356 41.373 4.31277L45.5054 14.6962C45.5304 14.7588 45.5894 14.7996 45.6549 14.7996C45.7204 14.7996 45.7796 14.7588 45.8044 14.6962L49.937 4.31277C50.0123 4.12356 50.1909 4 50.3893 4H55.821C56.0909 4 56.31 4.22573 56.31 4.50417V22.5626C56.31 22.8411 56.0909 23.0668 55.821 23.0668H51.8867C51.6166 23.0668 51.3977 22.8411 51.3977 22.5626V12.1323C51.3977 12.0834 51.3593 12.0438 51.312 12.0438C51.2766 12.0438 51.2448 12.0662 51.232 12.1001L47.2573 22.5971C47.184 22.7905 47.0032 22.9179 46.8017 22.9179H44.5089C44.3071 22.9179 44.126 22.79 44.053 22.5959L40.0778 12.0258C40.0649 11.9918 40.0333 11.9693 39.9978 11.9693C39.9505 11.9693 39.9121 12.0089 39.9121 12.0577V22.5626C39.9121 22.8411 39.6931 23.0668 39.4231 23.0668H35.489C35.2189 23.0668 35 22.8411 35 22.5626V4.50417Z"
      />
    </svg>
  ),
  InboxCustomize: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={17}
      height={17}
      viewBox="0 -960 960 960"
      {...props}
    >
      <path
        fill="currentColor"
        d="M200-160q-33 0-56.5-23.5T120-240v-560q0-33 23.5-56.5T200-880h560q33 0 56.5 23.5T840-800v226q-19-9-39-14.5t-41-8.5v-203H200v360h168q9 27 30 47t47 28q-3 20-4 40.5t2 40.5q-36-7-67.5-26.5T320-360H200v120h253q7 22 16 42t22 38H200Zm0-80h253-253Zm481 120-12-60q-12-5-22.5-10.5T625-204l-58 18-40-68 46-40q-2-12-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T669-460l12-60h80l12 60q12 5 22.5 10.5T817-436l58-18 40 68-46 40q2 12 2 26t-2 26l46 40-40 68-58-18q-11 8-21.5 13.5T773-180l-12 60h-80Zm40-120q33 0 56.5-23.5T801-320q0-33-23.5-56.5T721-400q-33 0-56.5 23.5T641-320q0 33 23.5 56.5T721-240Z"
      />
    </svg>
  ),
  Info: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} fill="none" {...props}>
      <path
        fill="currentColor"
        d="M6.333 5h1.333V3.667H6.333M7 12.333A5.34 5.34 0 0 1 1.666 7 5.34 5.34 0 0 1 7 1.667 5.34 5.34 0 0 1 12.333 7 5.34 5.34 0 0 1 7 12.333Zm0-12a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 7 .333Zm-.667 10h1.333v-4H6.333v4Z"
      />
    </svg>
  ),
  AlertCircle: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={17} fill="none" {...props}>
      <path
        fill="currentColor"
        d="M7.333 10.5h1.334v1.333H7.334V10.5Zm0-5.333h1.334v4H7.334v-4ZM8 1.833c-3.686 0-6.667 3-6.667 6.667A6.667 6.667 0 1 0 8 1.833Zm0 12A5.333 5.333 0 1 1 8 3.167a5.333 5.333 0 0 1 0 10.666Z"
      />
    </svg>
  ),

  Apple: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={19} height={23} fill="none" {...props}>
      <path
        fill="currentColor"
        d="M18.143 17.645a11.967 11.967 0 0 1-1.183 2.126c-.622.887-1.131 1.5-1.524 1.842-.608.56-1.26.846-1.958.862-.501 0-1.105-.143-1.809-.432-.706-.288-1.354-.43-1.947-.43-.622 0-1.29.142-2.003.43-.714.29-1.29.44-1.73.455-.67.029-1.337-.266-2.002-.885-.426-.371-.957-1.007-1.594-1.907-.683-.961-1.245-2.076-1.685-3.347C.236 14.986 0 13.656 0 12.369c0-1.474.319-2.746.957-3.811A5.612 5.612 0 0 1 2.96 6.53a5.39 5.39 0 0 1 2.71-.765c.531 0 1.228.165 2.095.488.863.324 1.418.489 1.661.489.182 0 .799-.192 1.843-.576.988-.355 1.822-.503 2.505-.445 1.851.15 3.242.88 4.166 2.194-1.655 1.003-2.474 2.408-2.458 4.21.015 1.404.524 2.572 1.525 3.5.454.43.96.763 1.524.999a16.56 16.56 0 0 1-.388 1.02ZM13.898.94c0 1.1-.402 2.128-1.204 3.079-.967 1.13-2.136 1.783-3.404 1.68a3.425 3.425 0 0 1-.026-.417c0-1.056.46-2.186 1.277-3.11.407-.469.926-.858 1.555-1.168.627-.306 1.22-.475 1.778-.504.017.147.024.294.024.44Z"
      />
    </svg>
  ),
  Google: (props: IconProps) => (
    <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath="url(#a)">
        <path
          d="M10 3.958c1.475 0 2.796.509 3.838 1.5l2.854-2.854C14.959.992 12.696 0 10 0a9.995 9.995 0 0 0-8.933 5.508l3.325 2.58c.787-2.371 3-4.13 5.608-4.13Z"
          fill="#585858"
        />
        <path
          d="M19.575 10.23c0-.655-.063-1.288-.158-1.897H10v3.759h5.392a4.648 4.648 0 0 1-1.992 2.991l3.22 2.5c1.88-1.741 2.955-4.316 2.955-7.354Z"
          fill="#878787"
        />
        <path
          d="M4.388 11.912A6.075 6.075 0 0 1 4.07 10c0-.667.112-1.308.317-1.913L1.063 5.508A9.964 9.964 0 0 0 0 10c0 1.617.383 3.142 1.067 4.492l3.32-2.58Z"
          fill="#D7D7D7"
        />
        <path
          d="M10 20c2.7 0 4.97-.887 6.62-2.42l-3.22-2.5c-.896.603-2.05.958-3.4.958-2.608 0-4.82-1.759-5.612-4.13l-3.325 2.58C2.712 17.758 6.091 20 10 20Z"
          fill="#B3B3B3"
        />
      </g>
      <defs>
        <clipPath id="a">
          <path fill="currentColor" d="M0 0h20v20H0z" />
        </clipPath>
      </defs>
    </svg>
  ),
  Check: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={17} fill="none" {...props}>
      <path fill="currentColor" d="m14 5.167-8 8L2.333 9.5l.94-.94L6 11.28l7.06-7.053.94.94Z" />
    </svg>
  ),
  Github: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} fill="none" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M11.21.22C5.412.22.71 5.038.71 10.984c0 4.757 3.009 8.792 7.18 10.216.525.1.718-.234.718-.518 0-.257-.01-1.105-.014-2.005-2.921.652-3.538-1.27-3.538-1.27-.477-1.244-1.165-1.575-1.165-1.575-.953-.668.071-.655.071-.655 1.055.076 1.61 1.11 1.61 1.11.936 1.646 2.456 1.17 3.056.895.094-.696.366-1.171.666-1.44-2.332-.272-4.784-1.195-4.784-5.32 0-1.176.41-2.136 1.082-2.89-.109-.271-.468-1.366.102-2.85 0 0 .882-.288 2.888 1.105a9.833 9.833 0 0 1 2.628-.363 9.857 9.857 0 0 1 2.63.363c2.005-1.393 2.885-1.104 2.885-1.104.572 1.483.212 2.578.103 2.849.674.754 1.08 1.714 1.08 2.89 0 4.135-2.455 5.045-4.794 5.312.377.334.712.989.712 1.993 0 1.44-.011 2.6-.011 2.955 0 .286.188.622.72.516 4.17-1.425 7.175-5.459 7.175-10.214 0-5.946-4.7-10.766-10.5-10.766Z"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        d="M4.687 15.677c-.023.053-.105.07-.18.033-.076-.036-.119-.109-.094-.162.023-.055.105-.07.18-.034.077.035.12.109.094.163Zm.425.486c-.05.047-.148.025-.214-.05-.069-.075-.082-.176-.03-.224.05-.047.146-.025.214.05.07.076.083.176.03.224Zm.414.62c-.064.046-.17.003-.234-.093-.065-.096-.065-.21.001-.257.065-.046.17-.004.235.09.064.098.064.213-.002.26Zm.568.599c-.058.065-.18.047-.27-.041-.092-.087-.117-.21-.06-.275.058-.066.182-.047.272.04.091.087.119.211.058.276Zm.782.348c-.026.084-.143.122-.262.087-.12-.037-.197-.136-.173-.221.025-.085.143-.125.263-.087.119.037.197.135.172.22Zm.86.064c.002.09-.098.163-.223.164-.126.003-.228-.069-.229-.156 0-.09.099-.162.224-.165.125-.002.228.07.228.157Zm.799-.139c.015.086-.072.175-.196.199-.122.023-.235-.03-.25-.116-.015-.09.073-.178.195-.201.124-.022.235.03.25.118Z"
      />
    </svg>
  ),
  OpenAI: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={120} height={24} fill="none" {...props}>
      <path
        fill="currentColor"
        d="M78.317 11.306c0-2.242 1.44-3.806 3.438-3.806 1.997 0 3.437 1.564 3.437 3.806 0 2.241-1.44 3.805-3.438 3.805-1.997 0-3.437-1.564-3.437-3.805Zm5.555 0c0-1.603-.875-2.645-2.118-2.645-1.242 0-2.117 1.038-2.117 2.645s.875 2.644 2.117 2.644c1.243 0 2.118-1.037 2.118-2.644Zm5.022 3.805c-.698 0-1.212-.278-1.55-.677v2.417h-1.235V9.6h1.234v.574c.339-.403.853-.677 1.551-.677 1.513 0 2.375 1.277 2.375 2.807s-.866 2.807-2.375 2.807ZM87.31 12.15v.317c0 .999.574 1.564 1.337 1.564.896 0 1.38-.698 1.38-1.727 0-1.028-.484-1.727-1.38-1.727-.763 0-1.337.557-1.337 1.573Zm7.298 2.961c-1.543 0-2.623-1.14-2.623-2.807s1.072-2.807 2.572-2.807 2.396 1.183 2.396 2.666v.411h-3.785c.095.926.647 1.492 1.44 1.492.609 0 1.089-.309 1.256-.866l1.059.403c-.382.947-1.235 1.513-2.315 1.513v-.005Zm-.06-4.577c-.638 0-1.131.382-1.315 1.11h2.477c-.009-.595-.382-1.11-1.162-1.11ZM97.882 15V9.6h1.234v.574c.308-.36.793-.677 1.491-.677 1.132 0 1.809.78 1.809 1.946V15h-1.234v-3.197c0-.669-.266-1.153-.947-1.153-.558 0-1.123.411-1.123 1.183V15h-1.235.005Zm8.151-7.384h1.492L110.323 15h-1.328l-.639-1.689h-3.189L104.542 15h-1.307l2.798-7.384Zm.72 1.461-1.153 3.086h2.323l-1.174-3.086h.004Zm5.687-1.461V15h-1.315V7.616h1.315ZM75.3 10.324a3.47 3.47 0 0 0 .159-1.435 3.387 3.387 0 0 0-.45-1.372 3.468 3.468 0 0 0-1.59-1.436 3.433 3.433 0 0 0-2.13-.222 3.418 3.418 0 0 0-2.58-1.149 3.46 3.46 0 0 0-3.3 2.391 3.418 3.418 0 0 0-2.285 1.659 3.458 3.458 0 0 0 .428 4.054 3.47 3.47 0 0 0-.158 1.436c.052.484.206.951.45 1.371a3.468 3.468 0 0 0 1.59 1.436c.669.3 1.415.377 2.13.223a3.417 3.417 0 0 0 2.58 1.148 3.467 3.467 0 0 0 3.3-2.396 3.417 3.417 0 0 0 2.284-1.658 3.445 3.445 0 0 0 .446-2.096 3.433 3.433 0 0 0-.874-1.954Zm-5.126 7.205c-.681 0-1.213-.21-1.671-.596.021-.013.055-.03.081-.047l2.73-1.577a.424.424 0 0 0 .163-.163.457.457 0 0 0 .06-.223v-3.849l1.153.669s.013.008.017.013c0 .004.004.012.009.017v3.188c0 1.445-1.205 2.572-2.542 2.572v-.005Zm-5.55-2.358a2.544 2.544 0 0 1-.304-1.723c.021.013.056.035.081.048l2.73 1.577c.069.038.146.06.223.06a.457.457 0 0 0 .223-.06l3.334-1.925v1.355c0 .004-.008.013-.013.017l-2.76 1.594a2.583 2.583 0 0 1-1.95.257 2.565 2.565 0 0 1-1.56-1.195l-.004-.005Zm-.72-5.961a2.56 2.56 0 0 1 1.337-1.127v3.248a.46.46 0 0 0 .06.223.425.425 0 0 0 .163.163l3.335 1.924-1.153.669s-.013.004-.017.008h-.022l-2.76-1.594a2.573 2.573 0 0 1-.943-3.51V9.21Zm9.484 2.207-3.334-1.924 1.153-.664s.013-.005.017-.009h.022l2.76 1.594a2.573 2.573 0 0 1 1.277 2.443 2.563 2.563 0 0 1-.519 1.337c-.295.39-.694.686-1.153.853V11.8a.457.457 0 0 0-.06-.223.425.425 0 0 0-.163-.163v.004Zm1.15-1.731s-.057-.035-.082-.047l-2.73-1.578a.445.445 0 0 0-.446 0l-3.334 1.925V8.63c0-.004.008-.012.013-.017l2.76-1.594a2.56 2.56 0 0 1 2.751.116 2.586 2.586 0 0 1 1.063 2.545l.004.005Zm-7.222 2.378-1.153-.668-.017-.013a.032.032 0 0 0-.009-.017V8.177c0-.488.141-.964.403-1.38a2.542 2.542 0 0 1 1.08-.947 2.604 2.604 0 0 1 1.418-.223c.485.064.943.262 1.316.574-.021.013-.055.03-.081.048l-2.73 1.577a.425.425 0 0 0-.163.163.457.457 0 0 0-.06.222v3.849l-.004.004Zm.625-1.35 1.483-.857 1.483.857v1.714l-1.483.858-1.483-.857v-1.715Zm-59.07 1.427V15H7.556V7.616h2.952c1.646 0 2.675.771 2.675 2.263 0 1.491-1.029 2.262-2.675 2.262H8.871Zm0-1.131h1.565c.947 0 1.448-.411 1.448-1.131s-.505-1.132-1.448-1.132H8.87v2.263Zm9.682 1.294c0 1.676-1.08 2.807-2.602 2.807-1.521 0-2.601-1.131-2.601-2.807 0-1.675 1.08-2.807 2.601-2.807 1.522 0 2.602 1.132 2.602 2.807Zm-3.96 0c0 1.102.523 1.77 1.358 1.77.836 0 1.359-.668 1.359-1.77 0-1.101-.523-1.77-1.359-1.77-.835 0-1.358.669-1.358 1.77ZM21.934 9.6h1.02l.969 3.579.956-3.579h1.225L24.48 15h-1.072l-.985-3.54-.986 3.54h-1.071L18.74 9.6h1.265l.977 3.579.956-3.579h-.005Zm6.964 5.511c-1.542 0-2.622-1.14-2.622-2.807s1.071-2.807 2.571-2.807c1.5 0 2.396 1.183 2.396 2.666v.411h-3.784c.094.926.647 1.492 1.44 1.492.608 0 1.088-.309 1.255-.866l1.059.403c-.382.947-1.235 1.513-2.315 1.513v-.005Zm-.06-4.577c-.638 0-1.13.382-1.315 1.11H30c-.009-.595-.381-1.11-1.162-1.11Zm6.348-.947v1.235a3.023 3.023 0 0 0-.455-.03c-.78 0-1.38.505-1.38 1.367v2.837h-1.234v-5.4h1.234v.801c.236-.506.793-.831 1.483-.831.146 0 .257.008.352.021Zm2.824 5.524c-1.543 0-2.623-1.14-2.623-2.807s1.072-2.807 2.572-2.807 2.395 1.183 2.395 2.666v.411H36.57c.094.926.647 1.492 1.44 1.492.608 0 1.089-.309 1.256-.866l1.058.403c-.381.947-1.234 1.513-2.314 1.513v-.005Zm-.06-4.577c-.639 0-1.132.382-1.316 1.11h2.477c-.008-.595-.381-1.11-1.161-1.11Zm5.319 4.577c-1.513 0-2.375-1.277-2.375-2.807s.866-2.807 2.375-2.807c.698 0 1.212.279 1.551.677V7.611h1.234v7.385H44.82v-.566c-.339.403-.853.677-1.551.677v.004Zm1.585-2.961c0-1.02-.574-1.573-1.337-1.573-.896 0-1.38.699-1.38 1.727 0 1.029.484 1.727 1.38 1.727.763 0 1.337-.565 1.337-1.564v-.317Zm7.453 2.961c-.699 0-1.213-.278-1.551-.677V15H49.52V7.616h1.235v2.563c.338-.403.852-.678 1.551-.678 1.513 0 2.374 1.278 2.374 2.808 0 1.53-.865 2.807-2.374 2.807v-.005Zm-1.586-2.961v.317c0 .999.575 1.564 1.338 1.564.895 0 1.38-.698 1.38-1.727 0-1.028-.485-1.727-1.38-1.727-.763 0-1.338.557-1.338 1.573Zm7.106 3.351c-.308.823-.78 1.389-1.903 1.389-.257 0-.33-.009-.505-.03v-1.037c.162.021.257.03.41.03.412 0 .61-.111.78-.544l.207-.506L54.853 9.6h1.294l1.329 3.784L58.77 9.6h1.277l-2.22 5.906V15.5Z"
      />
    </svg>
  ),
  Sidebar: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      fill="currentColor"
      viewBox="0 -960 960 960"
      {...props}
    >
      <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm240-80h400v-480H400v480Zm-80 0v-480H160v480h160Zm-160 0v-480 480Zm160 0h80-80Zm0-480h80-80Z" />
    </svg>
  ),
  SidebarFilled: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      fill="currentColor"
      viewBox="0 -960 960 960"
      {...props}
    >
      <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h160v640H160Zm240 0v-640h400q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H400Z" />
    </svg>
  ),
  Reconnect: (props: IconProps & { size?: number }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      fill="currentColor"
      viewBox="0 -960 960 960"
      {...props}
    >
      <path d="M760-120q-39 0-70-22.5T647-200H440q-66 0-113-47t-47-113q0-66 47-113t113-47h80q33 0 56.5-23.5T600-600q0-33-23.5-56.5T520-680H313q-13 35-43.5 57.5T200-600q-50 0-85-35t-35-85q0-50 35-85t85-35q39 0 69.5 22.5T313-760h207q66 0 113 47t47 113q0 66-47 113t-113 47h-80q-33 0-56.5 23.5T360-360q0 33 23.5 56.5T440-280h207q13-35 43.5-57.5T760-360q50 0 85 35t35 85q0 50-35 85t-85 35ZM200-680q17 0 28.5-11.5T240-720q0-17-11.5-28.5T200-760q-17 0-28.5 11.5T160-720q0 17 11.5 28.5T200-680Z" />
    </svg>
  ),

  X: FaXTwitter,
  Discord: PiDiscordLogo,
  GithubOutline: FiGithub,
  Fence: MdFence,
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
  Files: MdOutlineInventory2,
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
  Close: MdClose,
  Remove: MdRemove,
  Settings: MdOutlineSettings,
  Inbox: ArchiveIcon,
  Inbox2: MdOutlineInbox,
  Overview: MdBarChart,
  Transactions: MdOutlineListAlt,
  Invoice: MdOutlineDescription,
};
