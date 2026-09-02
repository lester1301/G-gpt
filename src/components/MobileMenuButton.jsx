function MobileMenuButton({ isOpen, onClick }) {

  return (
    <button
      className={`mobile-menu-button ${
        isOpen ? "active" : ""
      }`}
      onClick={onClick}
      aria-label={
        isOpen
          ? "Close sidebar"
          : "Open sidebar"
      }
      type="button"
    >

      <span></span>
      <span></span>
      <span></span>

    </button>
  );

}

export default MobileMenuButton;