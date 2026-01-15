function Cards(props) {
    return (
        <div className="Cards">
            <h2>{props.title}</h2>
            <h2>{props.daynight}</h2>
            <p>{props.time}</p>
            <button className="pricecard">{props.price}</button>
        </div>
    )
}

export default Cards;
